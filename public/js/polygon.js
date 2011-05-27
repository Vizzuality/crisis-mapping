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
      me.trigger("select_me", me);
    });
  },
  draw: function() {
    this.get("gpolygon").setPath(this.vertex);
  },
  enableEditing: function() {
    this.reset();

    var me = this;
    var points = this.get("gpolygon").getPath().getArray();
    this.markers = [];
    var marker = {};

    _.each(points, function(point, i){
      if (i !== 0) {
        marker = new google.maps.Marker({position:point, draggable:true, raiseOnDrag:false, map:me.map});
        me.markers.push(marker);

        google.maps.event.addListener(marker, "dragend", function() {
          var latLngs = [];
          _.each(me.markers, function(m) {
            latLngs.push(m.getPosition());
          });
          latLngs.push(_.first(me.markers).getPosition());
          me.get("gpolygon").setPath(latLngs);
          me.parent.save();
        });

        google.maps.event.addListener(marker, "drag", function() {
          var latLngs = [];
          _.each(me.markers, function(m) {
            latLngs.push(m.getPosition());
          });
          me.get("gpolygon").setPath(latLngs);
        });
      }
    });
  },
  reset: function() {
    _.each(this.markers, function(marker) {
      //google.maps.event.clearListener(marker);
      marker.setMap(null);
      delete marker;
    });
    this.markers = [];
    this.gpolyline.setPath([]);
    this.gpolyline.setMap(null);
  },
  add_vertex: function(latLng) {
    var me = this;

    var marker = new google.maps.Marker({
      position:latLng,
      map: this.map
    });

    this.markers.push(marker);

    if (this.vertex.length === 0) {
      google.maps.event.addListener(marker, "dblclick", function() {
        me.vertex.push(_.first(me.vertex));
        me.get("gpolygon").setPath(me.vertex);
        me.reset();
        me.parent.add(me);
        me.parent.save();
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
  setup: function(map) {
    this.map_ = map;
    this.create_polygon();
  },
  create_polygon: function() {
    var me = this;
    var polygon = new Polygon();
    polygon.setup(this.map_, this, null);

    polygon.bind("select_me", function(polygon) {
      polygon.enableEditing();
    });

    google.maps.event.clearListeners(this.map_, 'click');
    google.maps.event.addListener(this.map_, 'click', function(event) {
      polygon.add_vertex(event.latLng);
    });
  },
  draw: function() {
    var me = this;


    $.get("/get_polygons", {twitter_login:"javier"}, function(data) {

      if (data.rows.length > 0) {
        var geojson = eval("("+data.rows[0].st_asgeojson+")");

        _.each(geojson.coordinates, function(polygonsData) {
          _.each(polygonsData, function(coordinates){

            var points = [];

            _.each(coordinates, function(c){
              points.push(new google.maps.LatLng(c[1], c[0]));
            });

            var polygon = new Polygon();

            polygon.bind("select_me", function(polygon) {
              if (me.current_polygon) {
                me.current_polygon.reset();
              }
              me.current_polygon = polygon;
              polygon.enableEditing();
            });
            me.add(polygon);
            polygon.setup(me.map_, me, points);
            polygon.draw();

          });

        });
      }
    }, "json");
  },
  save: function() {

    var coordinates = this.get_coordinates();

    if (this.length == 1) {
      $.post("create", {coordinates:coordinates, twitter_login:"javier"}, function(data) { console.log(data); }, "json");
    } else {
      $.post("update", {coordinates:coordinates, twitter_login:"javier"}, function(data) { console.log(data); }, "json");
    }

  },
  get_coordinates: function() {
    var coordinates = [];

    this.map(function(polygon) {
      var c = [];
      _.each(polygon.get("gpolygon").getPath().getArray(), function(point) {
        var lat = point.lat();
        var lng = point.lng();
        c.push([lng + " " + lat]);
      });
      coordinates.push(c.join(","));
    });
    return coordinates.join(")),((");
  }
});



