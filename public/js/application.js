/*
*
* Copyright (c) 2011  vizzuality.com
*
*/

$(function(){

  var initialLocation = new google.maps.LatLng(18.553, -72.343);

  var Twitter = Backbone.Model.extend({
    initialize: function() {
     //this.set({screen_name: "prueba"});
    },
    setup: function() {
      var me = this;

      $.post("is_authorized", {twitter_login: me.screen_name}, function(data) {

        if (data.authorized) {
          me.set({screen_name: data.twitter_login});
          $(".mamufas").fadeOut();
          $(".signout").show();
          $(".signout").html(data.twitter_login + ", signout");
        }
      });

      twttr.anywhere(function (T) {
        T(".login").connectButton({
          authComplete: function(e, user) {
            me.current_user = T.currentUser;
            me.screen_name = me.current_user.data('screen_name');

            // We must authorize the user internally using the cookie
            // from Twitter and the consumer secret
            $.post("is_authorized", {twitter_login: me.screen_name}, function(data) {


              if (data.authorized) {
                MapView.polygons.trigger("refresh");
                me.set({screen_name: data.twitter_login});

                $(".mamufas").fadeOut();
                $(".signout").html(data.twitter_login + ", signout");
                $(".signout").show();
              }
            });
          },
          signOut: function() {
            // We must destroy the session after the user has signed out
            $.ajax({url:"signout", success:function(data) {


              if (!data.authorized) {

                me.set({screen_name: data.twitter_login});

                MapView.polygons.trigger("clean");

                $(".mamufas").fadeIn();
                $(".signout").html("Signout");
                $(".signout").hide();
              } else {
                alert("There was an error signing you out");
              }
            }});
          }
        });
        $(".signout").bind("click", function(e) { me.signout(e); });
      });
    },
    signout: function(e) {
      e.preventDefault();
      twttr.anywhere.signOut();
    }
  });

  //----------------------------------------

  var AppData = Backbone.Model.extend({
    defaults: {
      location: initialLocation,
      centered: false
    }
  });

  //----------------------------------------

  var MapView = {
    map: null,
    model: null,
    current_polygon: null,
    polygons: null,

    initPolygon: function() {
      var me = this;
    },

    setupMap: function() {
      var me = this;

      var opts = {
        zoom: 19,
            minZoom:13 ,

        center: this.model.get("location"),
          mapTypeId: google.maps.MapTypeId.SATELLITE,
          mapTypeControlOptions: {
            mapTypeIds: ['Before','After'],
            style: google.maps.NavigationControlStyle.SMALL,
            position: google.maps.ControlPosition.TOP_CENTER
    	   },
         zoomControl:false,
         scaleControl:false,
         navigationControl: false

      };
      this.map = new google.maps.Map(document.getElementById("map"), opts);

      var stylez = [{featureType: "all",elementType: "all",stylers: [{ saturation: -79 }]}];
      var styledMapOptions = {name: "cartodb"}


      var beforeOptions = {
            getTileUrl: function(tile, zoom) {
                var ymax = 1 << zoom;
                var y = ymax - tile.y - 1;
                return "http://mechanicalmapping2.s3.amazonaws.com/AOI1/before/" + zoom + "/" + tile.x + "/" + y + ".png";
            },
            tileSize: new google.maps.Size(256, 256),
            opacity:1.0,
            isPng: true,
            maxZoom: 20,
            name: "Before Earthquake"
        };


   /*
         Initialisation of the layer After EarthQuake AOI1
         */
        var afterOptions = {
            getTileUrl: function(tile, zoom) {
                var ymax = 1 << zoom;
                var y = ymax - tile.y - 1;
                return "http://mechanicalmapping2.s3.amazonaws.com/AOI1/after/" + zoom + "/" + tile.x + "/" + y + ".jpg";
            },
            tileSize: new google.maps.Size(256, 256),
            opacity:1.0,
            isPng: false,
            maxZoom: 20,
            name: "After"
        };

        // layers
        this.map.mapTypes.set('Before', new google.maps.ImageMapType(beforeOptions));
        this.map.mapTypes.set('After', new  google.maps.ImageMapType(afterOptions));



      $('a.zoom_in').click(function(ev){ev.stopPropagation();ev.preventDefault();me.zoomIn()});
      $('a.zoom_out').click(function(ev){ev.stopPropagation();ev.preventDefault();me.zoomOut()});
    },
    setup: function( options ) {
      var me = this;

      // init model
      this.model = options.model;
      this.setupMap();
      this.polygons = new Polygons();

      _.extend(this.polygons, Backbone.Events);

      // bind following methods to context of this obj
      _.bindAll(this, 'render');

      this.polygons.bind("clean", function() {
        me.polygons.clean();
      });

      this.polygons.bind("refresh", function() {
        me.polygons.refresh();
      });

      this.polygons.setup({map: this.map});
      this.polygons.draw();

      // bind any model changes
      this.model.bind('change', this.render);
      this.render();

      // done
      return this;
    },

    render: function() {
      return this;
    },

    zoomIn: function() {
      var zoom = this.map.getZoom();
      this.map.setZoom(zoom+1);
    },

    zoomOut: function() {
      var zoom = this.map.getZoom();
      this.map.setZoom(zoom-1);
    }
  };





  var App = Backbone.Controller.extend({
    appData: null,
    twitter:null,

    routes: {
      "":"index",
      "draw": "gotoDraw",
      "about": "gotoAbout",
      "result": "gotoResult"
    },

    initialize: function() {
      this.appData = new AppData();
      this.twitter = new Twitter();

      return this;
    },
    index: function() {
      // display the current location
      MapView.setup({model: this.appData});

      this.appData.set({"centered": true});
      this.twitter.setup();
    },
    gotoResult: function() {
      var opts = {
        zoom: 8,
        center: initialLocation,
        mapTypeControlOptions: {
    	      mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'cartodb']
    	   },
        disableDefaultUI: true
      };
      MapResult.setup({model: this.appData});
      $("section.tools, section.tips, section.mamufas").hide();
    }
  });

  //----------------------------------------

  var app = new App();
  Backbone.history.start();

});
