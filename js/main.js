var lat= 41.55;
var lng= -72.65;
var zoom= 9;

//Load a tile layer base map from USGS ESRI tile server https://viewer.nationalmap.gov/help/HowTo.htm
var hydro = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSHydroCached/MapServer/tile/{z}/{y}/{x}',{
    attribution: 'USGS The National Map: National Hydrography Dataset. Data refreshed March, 2020.',
    maxZoom:16}),
    topo = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',{
        attribution: 'USGS The National Map: National Boundaries Dataset, 3DEP Elevation Program, Geographic Names Information System, National Hydrography Dataset, National Land Cover Database, National Structures Dataset, and National Transportation Dataset; USGS Global Ecosystems; U.S. Census Bureau TIGER/Line data; USFS Road Data; Natural Earth Data; U.S. Department of State Humanitarian Information Unit; and NOAA National Centers for Environmental Information, U.S. Coastal Relief Model. Data refreshed May, 2020.USGS The National Map: National Topography Dataset. Data refreshed March, 2020.',
        maxZoom:16
    });

var baseMaps = {
    "Hydro": hydro,
    "Topo": topo,
  };

var map = L.map('map', {
    zoomControl: false,
    attributionControl: false,
    layers:[hydro]
});

map.setView([lat, lng], zoom);
map.createPane('top');
map.getPane('top').style.zIndex=650;

L.control.attribution({position: 'bottomleft'}).addTo(map);

L.control.zoom({
     position:'topright'
}).addTo(map);

L.control.layers(baseMaps).addTo(map);




// async load the JSON and csv data
var siteData = d3.json('https://www.waterqualitydata.us/data/Station/search?siteType=Stream&organization=CT_DEP01_WQX&characteristicName=Specific%20conductance&mimeType=geojson&zip=no&providers=STORET');
var resultData = d3.csv('https://www.waterqualitydata.us/data/Result/search?siteType=Stream&organization=CT_DEP01_WQX&characteristicName=Specific%20conductance&mimeType=csv&zip=no&dataProfile=resultPhysChem&providers=STORET')
var stateBoundaryData = d3.json('data/ctStateBoundary.geojson');
d3.select('#load').style("left","58%").style("top","40%").html("Loading Data...")
//[1] dynamic code here: CSS move to the center, then expand width and height
//[1.b] optional do animation, timer etc
Promise.all([siteData, resultData, stateBoundaryData]).then(addMapLayers);

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


function addMapLayers(data){
    //callback code to move data loading message
    d3.select('#load').style("left","0%").style("top","0%").html("");
    //callback code here you have all three data sets
    //[1.c] dynamic code here: CSS move to default=> abs pos 0,0 wi,h = 0,0

    //draw layers

    console.log(data);
    var sites  = data[0];
    var result = data[1];
    var bound  = data[2];

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

    for(var i=0; i<sites['features'].length; i++){
        let s = sites['features'][i]['properties']['MonitoringLocationIdentifier']
        let r = [];
        for(var j=0; j<result.length; j++){
            if(result[j]['MonitoringLocationIdentifier'] == s){
                r.push(Number(result[j]['ResultMeasureValue']))
                // console.log(r);
            }   
        }
        sites['features'][i]['properties']["maxsc"] = d3.max(r);
    }
    console.log(sites);

    var sidx = {};
    for(var i=0; i<sites['features'].length; i++){
        var sid = sites['features'][i]['properties']['MonitoringLocationIdentifier']; //get the hydro_id key for A[i]
        sidx[sid] = i;                              //key inserted into {} assign value i
    }

    for(var i=0; i<result.length; i++){
        let s = result[i]['MonitoringLocationIdentifier']
        let n = sidx[s]
        result[i]['HUC'] = (sites['features'][n]['properties']['HUCEightDigitCode']).slice(0,6)
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
    
    L.geoJSON(sites, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, geojsonMarkerOptions);
        },
        onEachFeature: function(feature, layer) {
            const props = layer.feature.properties;

        // set the fill color of layer based on its normalized data value
        layer.setStyle({
            fillColor: getColor(props['maxsc'], values)
        });
        let tooltipInfo = `<b>${props['MonitoringLocationName']}</b></br>
        Value: ${(props['maxsc']).toLocaleString()}</br>${props['HUCEightDigitCode']}`;

    // bind a tooltip to layer with county-specific information
    layer.bindTooltip(tooltipInfo, {
        // sticky property so tooltip follows the mouse
        sticky: true
    });

        }
    }).addTo(map);

    drawPlot(result)
}

function getColor(d, data){
    const c = ['#ede5cf','#e0c2a2','#d39c83','#c1766f','#a65461','#813753','#541f3f'];

    if(d <= d3.quantile(data, 0.1)){
        return c[0];
    } else if(data <= d3.quantile(data, 0.25)){
        return c[1];
    } else if(data <= d3.quantile(data, 0.5)){
        return c[2];
    } else if (d <= d3.quantile(data, 0.75)){
        return c[3];
    } else if (d <= d3.quantile(data, 0.9)){
        return c[5];
    } else if (d <= d3.max(data)){
        return c[6];
    } else {
        return 'black';
    }
}

function drawPlot(data){
    var p = Plot.plot({
                    grid: true,
                    inset: 6,
                    width: 350,
                    height: 300,
                    x: {type: "log", label: `Specific Conductance →`, labelAnchor: 'right'},
                    y: {label: `Ranges by HUC 6`, labelAnchor: 'top'},
                    marks: [
                    Plot.boxX(data, {x: "ResultMeasureValue", y: "HUC"})
                    ],
                    style: {
                        background: "#333333",
                        color: "white",
                        padding: "1px"
                    }
                })
    
    // let s = d3.select(p).selectAll("svg > g > text").style("font-size", "15px");
    
                document
                .querySelector("#Plot")
                .appendChild(p)
}

