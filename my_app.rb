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
  set :GOOGLE_SRID, 3785
  set :SRID, 4326
end

get '/' do
  erb :index
end

post '/polygon/create' do
  if coordinates = params[:coordinates]
    @cartodb = options.connection
    @cartodb.query("INSERT INTO #{options.table_name} (the_geom) VALUES (ST_GeomFromText('MULTIPOLYGON(((#{coordinates})))', #{options.SRID}))")
    return "ok".to_json
  end
  return "Error"
end
