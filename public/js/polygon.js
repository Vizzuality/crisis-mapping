var Polygon = Backbone.Model.extend({
  defaults: {
    colors:['red','blue','yellow'],
  },
  initialize: function() {

  },
  setup: function(map) {
    this.map = map;
    this.vertex = [];
    this.markers = [];

    this.gpolygon = new google.maps.Polygon({
      path:[],
      strokeColor: "#FF0000",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#FF0000",
      fillOpacity: 0.35,
      map: this.map
    });

    this.gpolyline = new google.maps.Polyline({
      path:[],
      strokeColor: "#FF0000",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      map: this.map
    });
  },
  reset: function() {
    _.each(this.markers, function(marker) {
      marker.setMap(null);
      delete marker;
    });
    this.markers = null;
  },
  addVertex: function(latLng) {
    var me = this;

    var marker = new google.maps.Marker({
      position:latLng,
      map: this.map
    });

    this.markers.push(marker);

    if (this.vertex.length == 0) {
      google.maps.event.addListener(marker, "dblclick", function() {
        me.gpolyline.setPath([]);
        me.gpolyline.setMap(null);
        me.vertex.push(_.first(me.vertex));

        me.gpolygon.setPath(me.vertex);

        me.trigger("finish");
      });
    }

    this.vertex.push(latLng);
    this.gpolyline.setPath(this.vertex);

  }
});

var Polygons = Backbone.Collection.extend({
  model: Polygon,
  save: function() {

  }
});



