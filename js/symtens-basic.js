//
//  Copyright (C) 2018 Robert Connelly and Simon D. Guest
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <http://www.gnu.org/licenses/>.
//

var g_detgraph = {
  "two" : {},
  "vert_line" : {},
  "x_intercept" : 0.5,
  "paths" : []
};


var g_render = {
  "state" : {},
  "renderer" : {},
  "geometry" : {},
  "scene" : {},
  "material" : {},
  "camera" : {},
  "controls" : {},
  "objs" : {},
  "geoms" : {},
  "takeScreenshot" : false,
  "screenshot" : {},

  "lines" : {},

  "background" :  [ 0x000000, 0xffffff, 0x006666 ],
  "material_color" : [ [ 0xffffff, 0xffaa00, 0xff00aa, 0xdddddd ],
                       [ 0x3333e6, 0xcc3333, 0xb2994c, 0xdddddd ] ],

  "default_color" : {
    "background" : 0xffffff,
    "c1" : 0x3333e6,
    "c2" : 0xcc3333,
    "s1" : 0xb2994c,
    "v" : 0xdddddd
  },

  "color" : {
    "background" : 0xffffff,
    "c1" : 0x3333e6,
    "c2" : 0xcc3333,
    "s1" : 0xb2994c,
    "v" : 0xdddddd
  },

  "vertex_radius" : {
    "scale_min": 0.125,
    "scale_max" : 5,
    "scale_value" : 1,
    "scale_default": 1,
    "cylinder": 0.05,
    "line" : 0.025
  },

  "default_vertex_radius" : {
    "cylinder": 0.05,
    "line" : 0.025
  },

  "cylinder_thickness": 0.025,
  "default_cylinder_thickness": 0.025,

  "cylinder_values" : {
    "scale_default": 1,
    "c1_scale_thick" : 1,
    "c2_scale_thick" : 1,
    "s1_scale_thick" : 1,
    "scale_min" : 0.125,
    "scale_max" : 5
  },

  "canvas_width" : 412,
  "canvas_height" : 412,

  "detgraph" : g_detgraph
}


function demo_resize(renderer, camera){
  var callback  = function(){
    // notify the renderer of the size change
    renderer.setSize( window.innerWidth, window.innerHeight );
    // update the camera
    camera.aspect  = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  // bind the resize event
  window.addEventListener('resize', callback, false);
  // return .stop() the function to stop watching window resize
  return {
    /**
     * Stop watching window resize
    */
    stop  : function(){
      window.removeEventListener('resize', callback);
    }
  };
}

function animate() {
  requestAnimationFrame( animate );
  g_render.controls.update();
  g_render.renderer.render( g_render.scene, g_render.camera );

  // See:
  // https://stackoverflow.com/questions/30628064/how-to-toggle-preservedrawingbuffer-in-three-js/30647502#30647502
  // https://stackoverflow.com/questions/3749231/download-file-using-javascript-jquery
  // https://stackoverflow.com/questions/8126623/downloading-canvas-element-to-an-image
  //
  if (g_render.takeScreenshot) {
    g_render.takeScreenshot = false;
    g_render.screenshot = g_render.renderer.domElement.toDataURL("image/png").replace("image/png", "image/octet-stream");
    setTimeout(download, 10);
  }
}

function display_init( canv_id ) {
  var scene = new THREE.Scene();
  var canvas_ele = document.getElementById( canv_id );
  var renderer = new THREE.WebGLRenderer( { canvas: canvas_ele, antialias: true });

  // trying to cut down on extraneous console output.
  // see: https://github.com/mrdoob/three.js/issues/9716
  //
  renderer.context.getShaderInfoLog = function () { return '' };

  var innerWidth = 300;
  var innerHeight = innerWidth;

  renderer.setSize( innerWidth, innerHeight );

  var camera = new THREE.PerspectiveCamera( 45, innerWidth / innerHeight, .01, 100 );
  var controls = new THREE.OrbitControls( camera, canvas_ele );

  camera.position.set( -2.0, 2.0, 1.5 );
  controls.update();

  g_render.scene = scene;
  g_render.renderer = renderer;
  g_render.camera = camera;
  g_render.controls = controls;

  g_render.scene.background = new THREE.Color( g_render.default_color.background );

  var tens = new symtensWeb.symtens;
  tens.init();

  //--

  tens.omeg1 = 0.7277777777777777;
  tens.omeg_1 = -0.19558098532523652;

  tens.c1 = 4;
  tens.c2 = 7;
  tens.s1 = 1;
  g_render["symtens"] = tens;

  var tenz = tens.realize_symmetric_tensegrity();
  g_render["prev_tenz"] = tenz;

  render(tenz);

  animate();
}

//----------------------------------------
//----------------------------------------
//
// render updates
//
//----------------------------------------
//----------------------------------------

function clear_scene() {
  var scene = g_render.scene;
  var camera = g_render.camera;
  if (typeof(scene) !== "undefined") {
    while(camera.children.length > 0){
      camera.remove(camera.children[0]);
    }
    while(scene.children.length > 0){ 
      scene.remove(scene.children[0]); 
    }
  }
}

function render_update(tenz) {

  for (var ii=0; ii<tenz.C1.length; ii++) {

    var p = tenz.C1[ii].length-1;
    if (p<2) { continue; }
    var midpoint = tenz.C1[ii][1];
    if (p!=2) {
      midpoint = numeric.add(tenz.C1[ii][0], numeric.mul( numeric.sub(tenz.C1[ii][p], tenz.C1[ii][0]), 0.5 ) );
    }

    var lookat = numeric.sub(tenz.C1[ii][p], tenz.C1[ii][0]);

    len = numeric.norm2(numeric.sub(tenz.C1[ii][p], tenz.C1[ii][0]));

    var axis = new THREE.Vector3(0,1,0);
    var lvec = new THREE.Vector3( lookat[0], lookat[1], lookat[2] );

    var mesh = g_render["geom_c1"][ii];

    mesh.rotation.set(0,0,0);
    mesh.scale.set(1,1,1);
    mesh.position.set(0,0,0);

    mesh.scale.y = len;
    mesh.scale.x = g_render.cylinder_values.c1_scale_thick;
    mesh.scale.z = g_render.cylinder_values.c1_scale_thick;

    mesh.material.color.setHex( g_render.color.c1 );

    mesh.translateX( midpoint[0] );
    mesh.translateY( midpoint[1] );
    mesh.translateZ( midpoint[2] );

    mesh.quaternion.setFromUnitVectors(axis, lvec.clone().normalize());
  }


  for (var ii=0; ii<tenz.C2.length; ii++) {

    var p = tenz.C2[ii].length-1;
    if (p<2) { continue; }
    var midpoint = tenz.C2[ii][1];
    if (p!=2) {
      midpoint = numeric.add(tenz.C2[ii][0], numeric.mul( numeric.sub(tenz.C2[ii][p], tenz.C2[ii][0]), 0.5 ) );
    }

    var lookat = numeric.sub(tenz.C2[ii][p], tenz.C2[ii][0]);

    len = numeric.norm2(numeric.sub(tenz.C2[ii][p], tenz.C2[ii][0]));

    var axis = new THREE.Vector3(0,1,0);
    var lvec = new THREE.Vector3( lookat[0], lookat[1], lookat[2] );

    var mesh = g_render["geom_c2"][ii];

    mesh.rotation.set(0,0,0);
    mesh.scale.set(1,1,1);
    mesh.position.set(0,0,0);

    mesh.scale.y = len;
    mesh.scale.x = g_render.cylinder_values.c2_scale_thick;
    mesh.scale.z = g_render.cylinder_values.c2_scale_thick;

    mesh.material.color.setHex( g_render.color.c2 );

    mesh.translateX( midpoint[0] );
    mesh.translateY( midpoint[1] );
    mesh.translateZ( midpoint[2] );


    mesh.quaternion.setFromUnitVectors(axis, lvec.clone().normalize());
  }

  for (var ii=0; ii<tenz.S1.length; ii++) {

    var p = tenz.S1[ii].length-1;
    if (p<2) { continue; }
    var midpoint = tenz.S1[ii][1];
    if (p!=2) {
      midpoint = numeric.add(tenz.S1[ii][0], numeric.mul( numeric.sub(tenz.S1[ii][p], tenz.S1[ii][0]), 0.5 ) );
    }

    var lookat = numeric.sub(tenz.S1[ii][p], tenz.S1[ii][0]);

    len = numeric.norm2(numeric.sub(tenz.S1[ii][p], tenz.S1[ii][0]));

    var axis = new THREE.Vector3(0,1,0);
    var lvec = new THREE.Vector3( lookat[0], lookat[1], lookat[2] );

    var mesh = g_render["geom_s1"][ii];

    mesh.rotation.set(0,0,0);
    mesh.scale.set(1,1,1);
    mesh.position.set(0,0,0);

    mesh.scale.y = len;
    mesh.scale.x = g_render.cylinder_values.s1_scale_thick;
    mesh.scale.z = g_render.cylinder_values.s1_scale_thick;

    mesh.material.color.setHex( g_render.color.s1 );

    mesh.translateX( midpoint[0] );
    mesh.translateY( midpoint[1] );
    mesh.translateZ( midpoint[2] );

    mesh.quaternion.setFromUnitVectors(axis, lvec.clone().normalize());
  }

  for (var ii=0; ii<tenz.V.length; ii++) {
    g_render["geom_v"][ii].scale.x = g_render.vertex_radius.scale_value;
    g_render["geom_v"][ii].scale.y = g_render.vertex_radius.scale_value;
    g_render["geom_v"][ii].scale.z = g_render.vertex_radius.scale_value;

    g_render["geom_v"][ii].position.x = tenz.V[ii][0];
    g_render["geom_v"][ii].position.y = tenz.V[ii][1];
    g_render["geom_v"][ii].position.z = tenz.V[ii][2];
  }

  // display lengths of cables and struts
  if (tenz.C1.length > 0) {
    var len = numeric.norm2(numeric.sub(tenz.C1[0][0], tenz.C1[0][2]));
    $("#c1_length").text(len.toString().substr(0,6));
  }
  if (tenz.C2.length > 0) {
    var len = numeric.norm2(numeric.sub(tenz.C2[0][0], tenz.C2[0][2]));
    $("#c2_length").text(len.toString().substr(0,6));
  }
  if (tenz.S1.length > 0) {
    var len = numeric.norm2(numeric.sub(tenz.S1[0][0], tenz.S1[0][2]));
    $("#s1_length").text(len.toString().substr(0,6));
  }

}

//----------------------------------------
//----------------------------------------
//
// render initialization
//
//----------------------------------------
//----------------------------------------

function render(tenz) {
  g_render.scene.background = new THREE.Color( g_render.color.background );
  var light = new THREE.PointLight( 0xffffff, 2 );
  g_render.camera.add( light );
  g_render.scene.add( g_render.camera );

  var geom_c2 = new THREE.Geometry();
  var geom_s1 = new THREE.Geometry();

  g_render["geom_c1"] = [];
  g_render["geom_c2"] = [];
  g_render["geom_s1"] = [];
  g_render["geom_v"] = [];

  //cthk = 0.025;
  var cthk = g_render.cylinder_thickness;

  c1_color = g_render.color.c1;
  c2_color = g_render.color.c2;
  s1_color = g_render.color.s1;
  v_color  = g_render.color.v;

  for (var ii=0; ii<tenz.C1.length; ii++) {

    var p = tenz.C1[ii].length-1;
    if (p<2) { continue; }
    var midpoint = tenz.C1[ii][1];
    if (p!=2) {
      midpoint = numeric.add(tenz.C1[ii][0], numeric.mul( numeric.sub(tenz.C1[ii][p], tenz.C1[ii][0]), 0.5 ) );
    }

    var lookat = numeric.sub(tenz.C1[ii][p], tenz.C1[ii][0]);

    len = numeric.norm2(numeric.sub(tenz.C1[ii][p], tenz.C1[ii][0]));

    var cgeom = new THREE.CylinderGeometry( cthk, cthk, 1, 10 );
    cgeom.computeFaceNormals();
    cgeom.mergeVertices();

    cgeom.computeVertexNormals();


    var v_material = new THREE.MeshPhongMaterial( {color: c1_color, specular: 0, shininess: 0, flatShading: false } );
    var mesh = new THREE.Mesh( cgeom, v_material );
    var axis = new THREE.Vector3(0,1,0);
    var lvec = new THREE.Vector3( lookat[0], lookat[1], lookat[2] );

    mesh.scale.y = len;

    mesh.translateX( midpoint[0] );
    mesh.translateY( midpoint[1] );
    mesh.translateZ( midpoint[2] );

    mesh.quaternion.setFromUnitVectors(axis, lvec.clone().normalize());
    g_render.scene.add( mesh );

    g_render["geom_c1"].push(mesh);
  }


  for (var ii=0; ii<tenz.C2.length; ii++) {

    var p = tenz.C2[ii].length-1;
    if (p<2) { continue; }
    var midpoint = tenz.C2[ii][1];
    if (p!=2) {
      midpoint = numeric.add(tenz.C2[ii][0], numeric.mul( numeric.sub(tenz.C2[ii][p], tenz.C2[ii][0]), 0.5 ) );
    }

    var lookat = numeric.sub(tenz.C2[ii][p], tenz.C2[ii][0]);

    len = numeric.norm2(numeric.sub(tenz.C2[ii][p], tenz.C2[ii][0]));

    var cgeom = new THREE.CylinderGeometry( cthk, cthk, 1, 10 );
    var v_material = new THREE.MeshPhongMaterial( {color: c2_color, specular: 0, shininess: 0, flatShading: false } );
    var mesh = new THREE.Mesh( cgeom, v_material );

    var axis = new THREE.Vector3(0,1,0);
    var lvec = new THREE.Vector3( lookat[0], lookat[1], lookat[2] );

    mesh.scale.y = len;

    mesh.translateX( midpoint[0] );
    mesh.translateY( midpoint[1] );
    mesh.translateZ( midpoint[2] );

    mesh.quaternion.setFromUnitVectors(axis, lvec.clone().normalize());
    g_render.scene.add( mesh );

    g_render["geom_c2"].push(mesh);
  }

  for (var ii=0; ii<tenz.S1.length; ii++) {

    var p = tenz.S1[ii].length-1;
    if (p<2) { continue; }
    var midpoint = tenz.S1[ii][1];
    if (p!=2) {
      midpoint = numeric.add(tenz.S1[ii][0], numeric.mul( numeric.sub(tenz.S1[ii][p], tenz.S1[ii][0]), 0.5 ) );
    }

    var lookat = numeric.sub(tenz.S1[ii][p], tenz.S1[ii][0]);

    len = numeric.norm2(numeric.sub(tenz.S1[ii][p], tenz.S1[ii][0]));

    var cgeom = new THREE.CylinderGeometry( cthk, cthk, 1, 10 );
    var v_material = new THREE.MeshPhongMaterial( {color: s1_color, specular: 0, shininess: 0, flatShading: false } );
    var mesh = new THREE.Mesh( cgeom, v_material );

    var axis = new THREE.Vector3(0,1,0);
    var lvec = new THREE.Vector3( lookat[0], lookat[1], lookat[2] );

    mesh.scale.y = len;

    mesh.translateX( midpoint[0] );
    mesh.translateY( midpoint[1] );
    mesh.translateZ( midpoint[2] );

    mesh.quaternion.setFromUnitVectors(axis, lvec.clone().normalize());
    g_render.scene.add( mesh );

    g_render["geom_s1"].push(mesh);

  }

  var vert_rad = g_render.vertex_radius.cylinder;

  for (var ii=0; ii<tenz.V.length; ii++) {
    var sgeom = new THREE.SphereGeometry(vert_rad, 32,32);
    var v_material = new THREE.MeshPhongMaterial( {color: v_color, specular: 0, shininess: 0, flatShading: false } );
    var sphere = new THREE.Mesh( sgeom, v_material );
    sphere.position.x = tenz.V[ii][0];
    sphere.position.y = tenz.V[ii][1];
    sphere.position.z = tenz.V[ii][2];
    g_render.scene.add( sphere );

    g_render["geom_v"].push(sphere);
  }

  // display lengths of cables and struts
  if (tenz.C1.length > 0) {
    var len = numeric.norm2(numeric.sub(tenz.C1[0][0], tenz.C1[0][2]));
    $("#c1_length").text(len.toString().substr(0,6));
  }
  if (tenz.C2.length > 0) {
    var len = numeric.norm2(numeric.sub(tenz.C2[0][0], tenz.C2[0][2]));
    $("#c2_length").text(len.toString().substr(0,6));
  }
  if (tenz.S1.length > 0) {
    var len = numeric.norm2(numeric.sub(tenz.S1[0][0], tenz.S1[0][2]));
    $("#s1_length").text(len.toString().substr(0,6));
  }
}



function tensegrity_sanity(tenz, prev) {
  if (tenz.C1.length != prev.C1.length) { console.log("C1 mismatch!"); }
  if (tenz.C2.length != prev.C2.length) { console.log("C2 mismatch!"); }
  if (tenz.S1.length != prev.S1.length) { console.log("S1 mismatch!"); }

  for (var ii=0; ii<tenz.C1.length; ii++) {
    if (tenz.C1[ii].length != prev.C1[ii].length) { console.log("C1", ii, "mismatch!"); }
  }

  for (var ii=0; ii<tenz.C2.length; ii++) {
    if (tenz.C2[ii].length != prev.C2[ii].length) { console.log("C2", ii, "mismatch!"); }
  }

  for (var ii=0; ii<tenz.S1.length; ii++) {
    if (tenz.S1[ii].length != prev.S1[ii].length) { console.log("S1", ii, "mismatch!"); }
  }
}


function update_detgraph_intercept(x,y) {
  //var x = mouse_x / g_render.detgraph.two.width;
  //var y = (g_render.detgraph.two.height - mouse_y) / g_render.detgraph.two.height;

  g_render.detgraph.x_intercept = x;

  // clamp to [0,1]
  //
  if (x<0) { x=0; } else if (x>1) { x=1; }
  if (y<0) { y=0; } else if (y>1) { y=1; }

  var st = g_render.symtens;
  var val = st.find0(x);
  var tenz = st.realize_symmetric_tensegrity();

  tensegrity_sanity(tenz, g_render["prev_tenz"]);
  g_render["prev_tenz"] = tenz;

  render_update(tenz);
}

function resizeCanvas() {

  var cam = g_render.camera;
  var w = g_render.canvas_width;
  var h = g_render.canvas_height;
  cam.aspect = w / h;
  cam.updateProjectionMatrix();
  g_render.renderer.setSize( w, h );

}

function change_group(group_idx, cable_idx, strut_idx, x) {
  group_idx = ((typeof group_idx === "undefined") ? 0 : group_idx);
  cable_idx = ((typeof cable_idx === "undefined") ? 0 : cable_idx);
  strut_idx = ((typeof strut_idx === "undefined") ? 0 : strut_idx);
  x = ((typeof x === "undefined") ? 0.5 : x);

  var st = g_render.symtens;

  var scene = g_render.scene;
  var camera = g_render.camera;
  if (typeof(scene) !== "undefined") {
    while(camera.children.length > 0){
      camera.remove(camera.children[0]);
    }
    while(scene.children.length > 0){
      scene.remove(scene.children[0]);
    }
  }

  g_render.detgraph.x_intercept = x;

  st.omeg1 = 0.35;
  st.grp = group_idx;
  st.c   = cable_idx;
  st.c1 = st.cablnumb3rs[st.grp][st.c][0];
  st.c2 = st.cablnumb3rs[st.grp][st.c][1];
  st.s1 = st.strutnumb3rs[st.grp][st.c][strut_idx];
  var val = st.find0(g_render.detgraph.x_intercept);

  var tenz = st.realize_symmetric_tensegrity();

  g_render["prev_tenz"] = tenz;

  render(tenz);

  //process_detgraph_update();
}


function restore_defaults() {
  var c = g_render.default_color.background;
  g_render.color.background = c;
  g_render.scene.background = new THREE.Color(c);

  c = g_render.default_color.c1;
  g_render.color.c1 = c;

  c = g_render.default_color.c2;
  g_render.color.c2 = c;

  c = g_render.default_color.s1;
  g_render.color.s1 = c;

  g_render.cylinder_values.c1_scale_thick = g_render.cylinder_values.scale_default;
  g_render.cylinder_values.c2_scale_thick = g_render.cylinder_values.scale_default;
  g_render.cylinder_values.s1_scale_thick = g_render.cylinder_values.scale_default;

  g_render.vertex_radius.scale_value = g_render.vertex_radius.scale_default;

  render_update(g_render.prev_tenz);
}

function init() {

  //DEBUG
  console.log("setting up display_init()");

  display_init( "canvas_id");

  //DEBUG
  console.log("setting up determinat graph");

  update_detgraph_intercept(0.55, 0.35);

  restore_defaults();

  change_group(1,0,0, 0.3);
}
