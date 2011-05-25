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
  set :TITLE, "Crisis Mapping"
  set :table_name, CartoDB::Settings["table_name"]
  set :connection, CartoDB::Connection
  set :CONSUMER_SECRET, "IgGoRPyo9DeFYZpWuSrIX9BEisEFLYJUm7DI2xmFVg"
  set :GOOGLE_SRID, 3785
  set :SRID, 4326
end

def is_authorized?
  session[:authorized] == true
end

get '/' do
  erb :index
end

get '/authorize' do
  cookie  = request.cookies["twitter_anywhere_identity"].split(":")

  user_id = cookie[0]
  secret  = cookie[1]

  # Let's check if the user is really who he/she is claiming
  session[:authorized] = Digest::SHA1.hexdigest(user_id + options.CONSUMER_SECRET) == secret
  is_authorized? ? "ok" : "nok"
end

get '/signout' do
  session[:authorized] = nil
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
