/*
 * Copyright (c) 2011  renardi[at]rdacorp[dot]com  (http://mobile.rdacorp.com)
 * Licensed under the MIT License
 *
 * This is sample demo of Google Map, Twitter Search, Backbone framework
 *
 */
$(function(){

	var initialLocation = new google.maps.LatLng( 40.69847032728747, -73.9514422416687 );

	//----------------------------------------

	var AppData = Backbone.Model.extend({
		defaults: {
			location: initialLocation,
			radius: 10,  // default to 10 miles
			centered: false
		}
	});

	//----------------------------------------

	var MapView = {
		map: null,
		model: null,
		polygons: [],
		geocoder: new google.maps.Geocoder(),

		setup: function( options ) {
			// init model
			this.model = options.model;
			// bind following methods to context of this obj
			_.bindAll(this, 'render', 'query');
			// get current location
			var position = this.model.get("location");
			// create the map
			var opts = {
				zoom: 8,
				center: position,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};
			this.map = new google.maps.Map(document.getElementById("map-canvas"), opts);
			// bind any model changes
			this.model.bind('change', this.render);
			// additional behaviors
			var self = this;
			// - bind the map click event
			google.maps.event.addListener(this.map, 'click', function(event) {
				self.model.set({"location": event.latLng, "centered": false});
			});
			//
			this.render();
			// done
			return this;
		},

		render: function() {
			// clear previous polygons/overlays
			_.each(this.polygons, function(item) {
				item.setMap(null);
			});
			this.polygons.length = 0;
			this.polygons = [];
			// get current parameters
			var position = this.model.get("location"),
			    radius = this.model.get("radius"),
				centered = this.model.get("centered");
			// add a new marker
			var marker = new google.maps.Marker({
				position: position,
				map: this.map,
				animation: google.maps.Animation.DROP,
				title: position.lat() + "," + position.lng()
			});
			this.polygons.push(marker);
			// centered it when asked
			if (centered) { this.map.setCenter(position); }
			return this;
		},

		query: function( address ) {
			var self = this;
			this.geocoder.geocode( {'address': address}, function(results, status) {
				if (status === "OK") {
					var position = results[0].geometry.location;
					if (position) {
						self.model.set({"location": position, "centered": true});
					}
				} else {
					alert("Geocode was not successful for the following reason: " + status);
				}
			});
		}

	};




	var App = Backbone.Controller.extend({
		appData: null,

	    routes: {
	        "":       "index",
			"draw":  "gotoDraw",
			"about":  "gotoAbout"
	    },

		initialize: function() {
			this.appData = new AppData();
			//
			MapView.setup({model: this.appData});
			//
			return this;
		},

	    index: function() {

 twttr.anywhere(function (T) {
    T("#login").connectButton({
      authComplete: function(user) {
        alert('hola');
        // triggered when auth completed successfully
      },
      signOut: function() {
        // triggered when user logs out
      }
    });
  });

			// display the current location
			var position = initialLocation;
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(function(position) {
					position = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
				});
			}
			this.appData.set({"location": position, "centered": true});
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
