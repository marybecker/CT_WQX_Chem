var lat= 41.55;
var lng= -72.65;
var zoom= 9;

//Load base map from USGS https://apps.nationalmap.gov/services/ and MapBox
var hydro = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSHydroCached/MapServer/tile/{z}/{y}/{x}',{
    attribution: 'USGS The National Map: National Hydrography Dataset.',
    maxZoom:16}),
    topo = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',{
        attribution: 'USGS The National Map: National Boundaries Dataset, 3DEP Elevation Program, Geographic Names Information System, National Hydrography Dataset, National Land Cover Database, National Structures Dataset, and National Transportation Dataset; USGS Global Ecosystems; U.S. Census Bureau TIGER/Line data; USFS Road Data; Natural Earth Data; U.S. Department of State Humanitarian Information Unit; and NOAA National Centers for Environmental Information, U.S. Coastal Relief Model.',
        maxZoom:16
    }),
    sat = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 22,
        id: 'mapbox.satellite',
        accessToken: 'pk.eyJ1IjoibWFyeS1iZWNrZXIiLCJhIjoiY2p3bTg0bDlqMDFkeTQzcDkxdjQ2Zm8yMSJ9._7mX0iT7OpPFGddTDO5XzQ'
    });

var baseMaps = {"NHD Hydro": hydro, "USGS Topo": topo, "MapBox Satellite": sat};

// Initial map view settings
var map = L.map('map', {zoomControl: false, attributionControl: false, layers:[hydro]});
var bounds = [[40.946713,-73.751221],[42.0839551, -71.7594548]];
map.fitBounds(bounds);
map.createPane('top');
map.getPane('top').style.zIndex=650;

// Controls on the map
L.control.attribution({position: 'bottomleft'}).addTo(map);
L.control.zoom({position:'topright'}).addTo(map);
L.control.layers(baseMaps).addTo(map);

getData('characteristicName=Specific%20conductance&')

d3.select('#dropdown-ui').on('change',function(d){
    map.eachLayer(function (layer) {
        if(layer.ID == "siteLayer"){
            layer.remove();
        }
    });
    var char_name = d.target.value;
    console.log(char_name);
    d3.select('#load').style("left","58%").style("top","40%").html("Loading Data...")
    getData(char_name);
});

function getData(characteristic){
    
    //delete
    d3.select('#Plot').html('');
    
    //deleteLayers()

    // Web service query build
    // Station example 'https://www.waterqualitydata.us/data/Station/search?siteType=Stream&organization=CT_DEP01_WQX&characteristicName=Specific%20conductance&mimeType=geojson&zip=no&providers=STORET'
    // Result example 'https://www.waterqualitydata.us/data/Result/search?siteType=Stream&organization=CT_DEP01_WQX&characteristicName=Specific%20conductance&mimeType=csv&zip=no&dataProfile=resultPhysChem&providers=STORET'
    var base = 'https://www.waterqualitydata.us/data/'
    var ssrc = 'Station/search?'
    var rsrc = 'Result/search?'
    var styp = 'siteType=Stream&'
    var orgn = 'organization=CT_DEP01_WQX&'
    var char = characteristic
    var stpf = 'mimeType=geojson&zip=no&providers=STORET'
    var rtpf = 'mimeType=csv&zip=no&dataProfile=resultPhysChem&providers=STORET'

    var surl = base + ssrc + styp + orgn + char + stpf
    var rurl = base + rsrc + styp + orgn + char + rtpf

    // async load the JSON and csv data
    var siteData = d3.json(surl);
    var resultData = d3.csv(rurl);
    var stateBoundaryData = d3.json('data/ctStateBoundary.geojson');
    var huc8Data = d3.csv('data/huc8NE.csv');

    

    Promise.all([siteData, resultData, stateBoundaryData, huc8Data, characteristic]).then(addMapLayers);
}

d3.select('#load').style("left","58%").style("top","40%").html("Loading Data...")
//[1] dynamic code here: CSS move to the center, then expand width and height
//[1.b] optional do animation, timer etc


//[0] have a div/span/ifram set to abs pos 0,0 with width,height=0,0

// //-----------------------click or event is here------------------------------
// //[1] dynamic code here: CSS move to the center, then expand width and height
// //[1.b] optional do animation, timer etc
// d3.json('jsonfile').then(function(sites){
//     d3.csv('csvfile').then(function(result){
//         d3.json('geojson').then(function(bound){
//             //callback code here you have all three data sets
//             //[1.c] dynamic code here: CSS move to default=> abs pos 0,0 wi,h = 0,0

//             //draw layers
//         })
//     })
// })

var siteLayer = null;

function addMapLayers(data){
    
    // map.removeLayer(siteLayer);
    //callback code to move data loading message
    d3.select('#load').style("left","0%").style("top","0%").html("");
    //callback code here you have all three data sets
    //[1.c] dynamic code here: CSS move to default=> abs pos 0,0 wi,h = 0,0

    //draw layers

    console.log(data);
    var sites  = data[0];
    var result = data[1];
    var bound  = data[2];
    var huc    = data[3];
    var char   = data[4];

    console.log(char);


    var values = [];
    for(var i=0; i<result.length;i++){
        values.push(Number(result[i]['ResultMeasureValue']))
    }

    console.log(values);
    d3.select('#l1').html(d3.format("d")(d3.quantile(values, 0.1)))
    d3.select('#l2').html(d3.format("d")(d3.quantile(values, 0.25)))
    d3.select('#l3').html(d3.format("d")(d3.quantile(values, 0.5)))
    d3.select('#l4').html(d3.format("d")(d3.quantile(values, 0.75)))
    d3.select('#l5').html(d3.format("d")(d3.quantile(values, 0.9)))

    // combine site loc & result data.  Add the max observed value to sites
    for(var i=0; i<sites['features'].length; i++){
        let s = sites['features'][i]['properties']['MonitoringLocationIdentifier']
        let r = [];
        let d = [];
        let sr = sites['features'][i]['properties']['results']= [];
        for(var j=0; j<result.length; j++){
            if(result[j]['MonitoringLocationIdentifier'] == s){
                r.push(Number(result[j]['ResultMeasureValue']))
                d.push((result[j]['ActivityStartDate']))
                // console.log(r);
            }    
        }
        sites['features'][i]['properties']['max'] = d3.max(r);
        sites['features'][i]['properties']['min'] = d3.min(r);
        sites['features'][i]['properties']['avg'] = d3.mean(r);
        sites['features'][i]['properties']['avg'] = d3.median(r);
        for(var k=0; k<r.length; k++){
            sr.push({value: r[k], date: d[k]});
        } 
        
    }
    console.log(sites);

    // create a site index
    var sidx = {};
    for(var i=0; i<sites['features'].length; i++){
        var sid = sites['features'][i]['properties']['MonitoringLocationIdentifier']; //get the sid key for A[i]
        sidx[sid] = i;   //key inserted into {} assign value i
    }

    //create a huc index
    var hidx = {};
    for(var i=0; i<huc.length; i++){
        var hid = huc[i]['huc8']; //get the huc id key
        hidx[hid] = i;  //key inserted into {} assign value i
    }
    

    // add the HUC 8 code to results for plotting
    for(var i=0; i<result.length; i++){
        let s = result[i]['MonitoringLocationIdentifier']
        let n = sidx[s]
        let h = sites['features'][n]['properties']['HUCEightDigitCode']
        let b = hidx[h]
        result[i]['HUC'] = h
        if(typeof huc[b] !== 'undefined'){
            result[i]['HUCname'] = huc[b]['name']
        } else {
            result[i]['HUCname'] = 'unknown'
        }
        result[i]['ResultMeasureValue'] = Number(result[i]['ResultMeasureValue'])
    }

    console.log(result);
    

    // load GeoJSON of CT Boundary
    var linestyle = {"color": "#333333","weight": 2,};
    L.geoJson(bound,{style:linestyle}).addTo(map);

    const props = sites.features.properties;

    var geojsonMarkerOptions = {
        radius: 8,
        fillColor: "#ffffff",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    var siteLayer = L.geoJSON(sites, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, geojsonMarkerOptions);
        },
        onEachFeature: function(feature, layer) {
            layer.ID = "siteLayer";
            const props = layer.feature.properties;
    
        // set the fill color of layer based on its normalized data value
        layer.setStyle({
            fillColor: getColor(props['max'], values, char)
        });
        let tooltipInfo = `<b>${props['MonitoringLocationName']}</b></br>
        ID: ${props['MonitoringLocationIdentifier']}</br>
        Max Observed Value: ${(props['max']).toLocaleString()}</br>
        HUC 8:${props['HUCEightDigitCode']}`;
        

    // bind a tooltip to layer with county-specific information
    layer.bindTooltip(tooltipInfo, {
        // sticky property so tooltip follows the mouse
        sticky: true
    });

        }
    })
    console.log(siteLayer);
    siteLayer.addTo(map);
    drawPlot(result)
}

function getColor(d, data, char){
    const c1 = ['#ede5cf','#e0c2a2','#d39c83','#c1766f','#a65461','#813753','#541f3f'];
    const c2 = ['#e4f1e1','#b4d9cc','#89c0b6','#63a6a0','#448c8a','#287274','#0d585f'];
    const c3 = ['#fde0c5','#facba6','#f8b58b','#f59e72','#f2855d','#ef6a4c','#eb4a40'];
    const c4 = ['#d1eeea','#a8dbd9','#85c4c9','#68abb8','#4f90a6','#3b738f','#2a5674'];

    if (char == 'characteristicName=Specific%20conductance&'){
        if(d <= d3.quantile(data, 0.1)){
            return c1[0];
        } else if(d <= d3.quantile(data, 0.25)){
            return c1[1];
        } else if(d <= d3.quantile(data, 0.5)){
            return c1[2];
        } else if (d <= d3.quantile(data, 0.75)){
            return c1[3];
        } else if (d <= d3.quantile(data, 0.9)){
            return c1[5];
        } else if (d <= d3.max(data)){
            return c1[6];
        } else {
            return 'black';
        }
    }

    if (char == 'characteristicName=pH&'){
        if(d <= d3.quantile(data, 0.1)){
            return c2[0];
        } else if(d <= d3.quantile(data, 0.25)){
            return c2[1];
        } else if(d <= d3.quantile(data, 0.5)){
            return c2[2];
        } else if (d <= d3.quantile(data, 0.75)){
            return c2[3];
        } else if (d <= d3.quantile(data, 0.9)){
            return c2[5];
        } else if (d <= d3.max(data)){
            return c2[6];
        } else {
            return 'black';
        }
    }

    if (char == 'characteristicName=Total%20dissolved%20solids&'){
        if(d <= d3.quantile(data, 0.1)){
            return c3[0];
        } else if(d <= d3.quantile(data, 0.25)){
            return c3[1];
        } else if(d <= d3.quantile(data, 0.5)){
            return c3[2];
        } else if (d <= d3.quantile(data, 0.75)){
            return c3[3];
        } else if (d <= d3.quantile(data, 0.9)){
            return c3[5];
        } else if (d <= d3.max(data)){
            return c3[6];
        } else {
            return 'black';
        }
    }

    if (char == 'characteristicName=Dissolved%20oxygen%20saturation&'){
        if(d <= d3.quantile(data, 0.1)){
            return c4[0];
        } else if(d <= d3.quantile(data, 0.25)){
            return c4[1];
        } else if(d <= d3.quantile(data, 0.5)){
            return c4[2];
        } else if (d <= d3.quantile(data, 0.75)){
            return c4[3];
        } else if (d <= d3.quantile(data, 0.9)){
            return c4[5];
        } else if (d <= d3.max(data)){
            return c4[6];
        } else {
            return 'black';
        }
    }

}


function drawPlot(data){
    var p = Plot.plot({
                    grid: true,
                    marginLeft: 120,
                    width: 500,
                    height: 350,
                    x: {type: "log", label: `Specific Conductance →`, labelAnchor: 'right'},
                    y: {label: `Ranges by HUC 8`, labelAnchor: 'top'},
                    marks: [
                    Plot.boxX(data, {x: "ResultMeasureValue", y: "HUCname"})
                    ],
                    style: {
                        background: "#333333",
                        color: "white",
                        fontSize: 14
                    }
                })
    
    // let s = d3.select(p).selectAll("svg > g > text").style("font-size", "15px");
    
                document
                .querySelector("#Plot")
                .appendChild(p)
}

function drawSitePlot(data){
    Plot.plot({
        grid: true,
        width: 400,
        height: 200,
        x: {label: `Sample Date →`, labelAnchor: 'right'},
        y: {label: `↑ Specific Conductance`},
        marks: [
            Plot.dot(data, {y: "value", x: "date"})
        ],
        style: {
            background: "#333333",
            color: "white",
            fontSize: 12,
            padding: "1px"
        }
    })
}

