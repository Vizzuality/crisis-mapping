var Polygon = Backbone.Model.extend({
  defaults: {
    gpolygon:null,
    colors:['red','blue','yellow']
  },
  initialize: function() {

  },
  setup: function(map, parent, points) {
    var me = this;
    this.map = map;
    this.parent = parent;
    this.vertex = [];

    if (points !== null) {
      this.vertex = points;
    }

    this.markers = [];

    this.set({gpolygon:new google.maps.Polygon({
      path:[],
      strokeColor: "#FF0000",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#FF0000",
      fillOpacity: 0.35,
      map: this.map
    })
    });

    this.gpolyline = new google.maps.Polyline({
      path:[],
      strokeColor: "#FF0000",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      map: this.map
    });

    google.maps.event.addListener(this.get("gpolygon"), 'click', function(event) {
      me.parent.select_polygon(me);
      //me.trigger("select_me", me);
    });
  },
  draw: function() {
    this.get("gpolygon").setPath(this.vertex);
  },
  reset: function() {
    this.get("gpolygon").stopEdit();

    _.each(this.markers, function(marker) {
      marker.setMap(null);
      delete marker;
    });

    this.markers = [];
    this.gpolyline.setPath([]);
    this.gpolyline.setMap(null);
  },
  add_vertex: function(latLng) {
    var me = this;

    var image = new google.maps.MarkerImage('img/sprite.png',new google.maps.Size(11, 11),new google.maps.Point(0,52),new google.maps.Point(5, 5));

    var marker = new google.maps.Marker({position: latLng,map: this.map,icon: image});

    this.markers.push(marker);

    if (this.vertex.length === 0) {

      google.maps.event.addListener(marker, "dblclick", function() {
        me.get("gpolygon").setPath(me.vertex);
        me.get("gpolygon").stopEdit();
        me.reset();
        me.parent.add(me);
        me.parent.store();
        me.parent.create_polygon();
      });
    }

    this.vertex.push(latLng);
    this.gpolyline.setPath(this.vertex);
  }
});

var Polygons = Backbone.Collection.extend({
  current_polygon:null,
  model: Polygon,
  initialize: function() {
    var me = this;
  },
  setup: function( options ) {
    this.map_ = options.map;
    this.create_polygon();
  },
  create_polygon: function() {
    var me = this;
    var polygon = new Polygon();

    polygon.setup(this.map_, this, null);

    google.maps.event.clearListeners(this.map_, 'click');
    google.maps.event.addListener(this.map_, 'click', function(event) {
      if (me.current_polygon) {
        me.current_polygon.get("gpolygon").stopEdit();
        me.current_polygon.reset();
      }
      polygon.add_vertex(event.latLng);
    });
  },
  select_polygon: function(polygon) {
    var me = this;

    if (this.current_polygon) {
      $(document).unbind("moveVertex");
      $(document).unbind("createGhostVertex");
      $(document).unbind("removeVertex");

      this.current_polygon.unbind("select_me");
      this.current_polygon.get("gpolygon").stopEdit();
      //this.current_polygon.reset();
    }

    this.current_polygon = polygon;

    polygon.get("gpolygon").runEdit(true);

      $(document).bind("createGhostVertex", function() {
        me.store();
      });

      $(document).bind("moveVertex", function() {
        me.store();
      });

      $(document).bind("removeVertex", function(evt, vertex_count) {
        console.log("vertex_count: ", vertex_count);

        if (vertex_count < 3) {
          polygon.get("gpolygon").setMap(null);
          polygon.reset();
          me.remove(polygon);
        }

        if (me.length == 0) {
          me.empty_polygon();
        } else {
          me.store();
        }
      });
  },
  refresh:function() {
    this.clean();
    this.draw();
  },
  clean: function() {
    this.map(function(polygon) {
      polygon.get("gpolygon").setMap(null);
      polygon.reset();
    });
  },
  draw: function() {
    var me = this;

    $.get("/get_polygons", function(data) {

      if (data.rows.length > 0) {

        if (data.rows[0].st_asgeojson === null) {
          return;
        }

        var geojson = eval("("+data.rows[0].st_asgeojson+")");

        _.each(geojson.coordinates, function(polygonsData) {
          _.each(polygonsData, function(coordinates){

            var points = [];

            // Since we're using polygonEdit.js, we don't need to draw the last point
            _.each(coordinates, function(c, i){
              if (i < coordinates.length - 1) {
                points.push(new google.maps.LatLng(c[1], c[0]));
              }
            });

            var polygon = new Polygon();

            me.add(polygon);
            console.log("Collection of: ", this.length);
            polygon.setup(me.map_, me, points);
            polygon.draw();

          });

        });
      } else {
        $.post("setup_row", function(data) { console.log(data); }, "json");
      }
    }, "json");
  },
  empty_polygon: function() {
    $.post("reset", function(data) { console.log(data); }, "json");
  },
  store: function() {
    console.log("saving");
    var coordinates = this.get_coordinates();
    console.log("Length: ", this.length, "Coordinates: ", coordinates);
    $.post("update", {coordinates:coordinates}, function(data) { console.log(data); }, "json");
  },
  get_coordinates: function() {
    var coordinates = [];
    var first_coordinate = [];

    this.map(function(polygon) {
      var c = [];
      var gpolygons = polygon.get("gpolygon").getPath().getArray();

      // Since we're using polygonEdit.js, we have to copy the first point again
      _.each(gpolygons, function(point, i) {
        var lat = point.lat();
        var lng = point.lng();
        c.push([lng + " " + lat]);

        if (i == 0) {
          first_coordinate = [lng + " " + lat];
        }

        if (i == gpolygons.length - 1) {
          c.push(first_coordinate);
        }

      });
      coordinates.push(c.join(","));
    });

    return coordinates.join(")),((");
  }
});

