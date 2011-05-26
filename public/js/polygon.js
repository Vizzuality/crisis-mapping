var Polygon = Backbone.Model.extend({
  defaults: {
    colors:['red','blue','yellow'],
  },
  initialize: function() {

  },
  setup: function(map) {
    this.map = map;
    this.vertex = [];

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
  addVertex: function(latLng) {
    var marker = new google.maps.Marker({
      position:latLng,
      map: this.map
    });

    this.vertex.push(latLng);
    this.gpolyline.setPath(this.vertex);

  }
});

var Polygons = Backbone.Collection.extend({
  model: Polygon,
  save: function() {

  }
});



