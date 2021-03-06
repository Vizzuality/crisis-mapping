require 'rubygems'
require 'bundler/setup'

require 'sinatra'
require "openssl"
require "erb"
require 'yaml'

require 'cartodb-rb-client'
require 'cartodb-rb-client/cartodb'
require 'active_support/core_ext/array/random_access.rb'

CartoDB::Settings   = YAML.load_file("#{File.dirname(__FILE__)}/config/cartodb_config.yml")[ENV["RACK_ENV"]] unless defined? CartoDB::Settings
CartoDB::Connection = CartoDB::Client::Connection.new unless defined? CartoDB::Connection

configure do
  enable :sessions
  set :TITLE, "Crisis Mapping"
  set :table_name, CartoDB::Settings["table_name"]
  set :connection, CartoDB::Connection
  set :CONSUMER_SECRET, "IgGoRPyo9DeFYZpWuSrIX9BEisEFLYJUm7DI2xmFVg"
  set :GOOGLE_SRID, 3785
  set :SRID, 4326
end

@twitter_login = ""

def is_authorized?(twitter_login = "")

  if ENV["RACK_ENV"] == "development"
    @twitter_login = "cartodb";
    return true
  end

  twitter_cookie = request.cookies["twitter_anywhere_identity"]

  puts "twitter_cookie -> #{twitter_cookie}"

  return false if twitter_cookie.nil? or twitter_cookie == ""

  cookie  = twitter_cookie.split(":")

  user_id = cookie[0]
  secret  = cookie[1]

  @twitter_login = twitter_login unless twitter_login.nil? or twitter_login == ""

  return false if user_id.nil? or secret.nil?
  # Let's check if the user is really who he/she is claiming to be or not
  puts "#{Digest::SHA1.hexdigest(user_id + options.CONSUMER_SECRET)} == #{secret}"
  return Digest::SHA1.hexdigest(user_id + options.CONSUMER_SECRET) == secret
end

get '/' do
  erb :index
end

post '/is_authorized' do
  content_type :json
    is_authorized?(params[:twitter_login]) ? {:authorized => true, :twitter_login => @twitter_login}.to_json : {:authorized => false}.to_json
end

get '/signout' do
  response.set_cookie("twitter_anywhere_identity", "")
  @twitter_login = ""
  puts "is_authorized: #{is_authorized?}"
  content_type :json
    is_authorized? ? {:authorized => true, :cookie => request.cookies["twitter_anywhere_identity"] }.to_json : {:authorized => false, :cookie =>request.cookies["twitter_anywhere_identity"] }.to_json
end

post '/reset' do
  puts "Reset"
  if is_authorized?
    twitter_login = params[:twitter_login]
    query = "UPDATE #{options.table_name} SET the_geom = NULL WHERE twitter_login = '#{twitter_login}'"
    @cartodb = options.connection
    @cartodb.query(query)
    return "ok".to_json
  end
  return "Error"
end

post '/setup_row' do
  puts "Setup row"
  if is_authorized?
    twitter_login = params[:twitter_login]
    query = "INSERT INTO #{options.table_name} (twitter_login, the_geom) VALUES ('#{twitter_login}', NULL)"
    @cartodb = options.connection
    @cartodb.query(query)
    return "ok".to_json
  end
  return "Error"
end

post '/update' do
  puts "Update #{params[:coordinates]}, #{params[:twitter_login]}"
  if is_authorized? and coordinates = params[:coordinates]
    twitter_login = params[:twitter_login]
    query = "UPDATE #{options.table_name} SET the_geom = (ST_GeomFromText('MULTIPOLYGON(((#{coordinates})))', #{options.SRID})) WHERE twitter_login = '#{twitter_login}'"
    puts query
    @cartodb = options.connection
    @cartodb.query(query)
    return "ok".to_json
  end
  return "Error"
end

get '/get_polygons' do
  if is_authorized?
    twitter_login = params[:twitter_login]
    query = "SELECT twitter_login, ST_AsGeoJSON(the_geom) FROM #{options.table_name} WHERE twitter_login = '#{twitter_login}';";
    puts query
    @cartodb = options.connection
    result = @cartodb.query(query)
    puts result
    return result.to_json
  end
  return "Error"
end

get '/get_result' do
    query = "SELECT twitter_login, ST_AsGeoJSON(the_geom) FROM #{options.table_name} WHERE twitter_login = 'cartodb';";
    @cartodb = options.connection
    result = @cartodb.query(query)
    return result.to_json
end
