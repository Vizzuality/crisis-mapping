/*
*
* Copyright (c) 2011  vizzuality.com
*
*/

$(function(){

  var initialLocation = new google.maps.LatLng(40.69847032728747, -73.9514422416687);

  var Twitter = Backbone.Model.extend({
    initialize: function() {
     //this.set({screen_name: "prueba"});
    },
    setup: function() {
      var me = this;

      $.post("is_authorized", {twitter_login: me.screen_name}, function(data) {
        console.log("is authorized? : ", data);

        if (data.authorized) {
          me.set({screen_name: data.twitter_login});
          $(".mamufas").hide();
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

              console.log(data);

              if (data.authorized) {
                console.log("Authorized", data);
                MapView.polygons.trigger("refresh");
                me.set({screen_name: data.twitter_login});

                $(".mamufas").hide();
                $(".signout").html(data.twitter_login + ", signout");
                $(".signout").show();
              }
            });
          },
          signOut: function() {
            // We must destroy the session after the user has signed out
            console.log("quitting");
            $.ajax({url:"signout", success:function(data) {

              console.log("-", data);

              if (!data.authorized) {

                me.set({screen_name: data.twitter_login});

                MapView.polygons.trigger("clean");

                $(".login").show();
                $(".signout").html("Signout");
                $(".signout").hide();
              } else {
                alert("There was an error signing you out");
                console.log(data);
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
    setup: function( options ) {
      var me = this;
      // init model
      this.model = options.model;
      // bind following methods to context of this obj
      _.bindAll(this, 'render');
      // get current location
      var position = this.model.get("location");
      // create the map
      var opts = {
        zoom: 8,
        center: position,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true
      };

      this.map = new google.maps.Map(document.getElementById("map"), opts);

      $('a.zoom_in').click(function(ev){ev.stopPropagation();ev.preventDefault();me.zoomIn()});
      $('a.zoom_out').click(function(ev){ev.stopPropagation();ev.preventDefault();me.zoomOut()});

      this.polygons = new Polygons();

      _.extend(this.polygons, Backbone.Events);

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
      "about": "gotoAbout"
    },



    initialize: function() {
      this.appData = new AppData();
      this.twitter = new Twitter();

      MapView.setup({model: this.appData});
      return this;
    },

    index: function() {

      // display the current location
      this.appData.set({"centered": true});
      this.twitter.setup();
    },
    gotoDraw: function() {

    },
    gotoAbout: function() {
    }

  });

  //----------------------------------------

  var app = new App();
  Backbone.history.start();

});
