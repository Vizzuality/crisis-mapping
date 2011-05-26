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

def is_authorized?
  cookie  = request.cookies["twitter_anywhere_identity"].split(":")

  user_id = cookie[0]
  secret  = cookie[1]

  # Let's check if the user is really who he/she is claiming to be or not
  Digest::SHA1.hexdigest(user_id + options.CONSUMER_SECRET) == secret
end

get '/' do
  erb :index
end

get '/is_already_authorized' do
  is_authorized? ? "ok" : "nok"
end

get '/authorize' do
  is_authorized? ? "ok" : "nok"
end

get '/signout' do
  # We must get rid of the session and the cookie
  session[:authorized] = nil
  set_cookie["twitter_anywhere_identity"] = nil
  is_authorized? ? "nok" : "ok"
end

post '/polygon/create' do
  return unless session[:authorized]

  if coordinates = params[:coordinates]
    @cartodb = options.connection
    @cartodb.query("INSERT INTO #{options.table_name} (the_geom) VALUES (ST_GeomFromText('MULTIPOLYGON(((#{coordinates})))', #{options.SRID}))")
    return "ok".to_json
  end
  return "Error"
end
