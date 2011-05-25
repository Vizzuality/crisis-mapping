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
  set :table_name, CartoDB::Settings["table_name"]
  set :connection, CartoDB::Connection
  set :GOOGLE_SRID, 3785
  set :SRID, 4326
end

helpers do
  def navigation
    erb :navigation
  end

  def form
    erb :form
  end
end

get '/' do
  erb :index
end

get '/search' do
  erb :search
end

get '/edit' do
  erb :edit
end

get '/create' do
  erb :index
end

post '/point/new' do
  @cartodb = options.connection

  unless params[:food] == "undefined" or params[:food] == ""
    results = @cartodb.query("SELECT name, tipocomida FROM #{options.table_name} WHERE tipocomida = '#{params[:food]}' AND ST_Contains(#{options.table_name}.the_geom, ST_Transform(ST_GeomFromText('POINT(#{params[:coordinates]})', 4326), 3785) ) = true")
  else
    results = @cartodb.query("SELECT name, tipocomida FROM #{options.table_name} WHERE ST_Contains(#{options.table_name}.the_geom, ST_Transform(ST_GeomFromText('POINT(#{params[:coordinates]})', 4326), 3785)) = true")
  end

  puts results.inspect
  results.rows.to_json if results and results.rows.size > 0
end

post '/polygon/create' do
  @cartodb = options.connection
  @cartodb.query("INSERT INTO #{options.table_name}(the_geom,name,tipocomida) VALUES (ST_Transform( ST_GeomFromText('MULTIPOLYGON(((#{params[:coordinates]})))', #{options.SRID}), #{options.GOOGLE_SRID}), '#{params[:name]}', '#{params[:food]}')")
  "ok".to_json # TODO: return actual value from cartodb
end

get '/polygon/show' do
  @cartodb = CartoDB::Connection
  result = @cartodb.query("SELECT ST_AsGeoJSON(ST_Transform(the_geom, #{options.SRID})) FROM #{options.table_name} WHERE the_geom IS NOT NULL");
  puts result.inspect
  result.to_json
end
