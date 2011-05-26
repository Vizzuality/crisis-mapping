

    var Polygon = Backbone.Model.extend({
       defaults: {
         colors:['red','blue','yellow'],
         vertex: [],
         gpolygon: null,
         gpolyline:null,
         map: null
       },
       setup: function(map) {
         this.map = map;

         this.gpolygon = new google.maps.Polygon({
           path:[],
           strokeColor: "#FF0000",
           strokeOpacity: 0.8,
           strokeWeight: 2,
           fillColor: "#FF0000",
           fillOpacity: 0.35, 
           map: this.map
           });    
           
           this.gpolyline = new.google.maps.Polyline({
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
       }

     });
     
     var Polygons = Backbone.Collection.extend({
       model: Polygon,
       
       save: function() {
         
       }
       
     });
     
     
    