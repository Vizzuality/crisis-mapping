/*
* Copyright (c) 2011  vizzuality.com
*
*/
$(function(){

  var initialLocation = new google.maps.LatLng( 40.69847032728747, -73.9514422416687 );

  var Twitter = Backbone.Model.extend({
    defaults: {
      current_user: null,
      screen_name: null
    },
    setup: function() {
      var me = this;

      $.ajax({url:"is_authorized", success:function(data) {
        console.log("is authorized? : ", data);
        if (data == "ok") {
          $(".login").hide();
          $(".signout").show();
        }
      }});

      twttr.anywhere(function (T) {
        T(".login").connectButton({
          authComplete: function(e, user) {
            me.current_user = T.currentUser;
            me.screen_name = me.current_user.data('screen_name');

            // We must authorize the user internally using the cookie
            // from Twitter and the consumer secret
            $.ajax({url:"is_authorized", success:function(data) {
              if (data == "ok") {
                $(".login").hide();
                $(".signout").show();
              }
            }});
          },
          signOut: function() {
            // We must destroy the session after the user has signed out
            $.ajax({url:"signout", success:function(data) {
              console.log(data);
              if (data == "ok") {
                $(".login").show();
                $(".signout").hide();
              }
            }});
          }
        });
        $(".signout").bind("click", function(e) { me.signout(e); });
      });
    },
    success: function(e, user) {
    },
    signout: function(e) {
      e.preventDefault();
      twttr.anywhere.signOut();
    },
    error: function() {
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

    setup: function( options ) {
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
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      this.map = new google.maps.Map(document.getElementById("map"), opts);

      this.current_polygon = new Polygon();
      this.current_polygon.setup(this.map);
      // bind any model changes
      this.model.bind('change', this.render);
      // additional behaviors
      var self = this;
      // - bind the map click event
      google.maps.event.addListener(this.map, 'click', function(event) {
        self.current_polygon.addVertex(event.latLng);
        // self.model.set({"location": event.latLng, "centered": false});
      });
      
      this.render();
      
      
      // done
      return this;
    },

    render: function() {
      // clear previous polygons/overlays
      // _.each(this.polygons, function(item) {
      //   item.setMap(null);
      // });
      // this.polygons.length = 0;
      // this.polygons = [];

      return this;
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
