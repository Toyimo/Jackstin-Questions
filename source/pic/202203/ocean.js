const viewer = new Cesium.Viewer("cesiumContainer", {
  infoBox: false, //Disable InfoBox widget
  selectionIndicator: false, //Disable selection indicator
  shouldAnimate: true, // Enable animations
  terrainProvider: Cesium.createWorldTerrain(),
});


//Enable lighting based on the sun position
viewer.scene.globe.enableLighting = true;

//Enable depth testing so things behind the terrain disappear.
viewer.scene.globe.depthTestAgainstTerrain = true;

//Shader
var fragment =  'varying vec3 v_positionMC;\n' +
                'varying vec3 v_positionEC;\n' +
                'varying vec2 v_st;\n' +

                'void main()\n' +
                '{\n' +
                '    czm_materialInput materialInput;\n' +
                '    vec3 normalEC = normalize(czm_normal3D * czm_geodeticSurfaceNormal(v_positionMC, vec3(0.0), vec3(1.0)));\n' +
                '    vec3 positionToEyeEC = -v_positionEC;\n' +

                '    #ifdef FACE_FORWARD\n' +
                '        normalEC = faceforward(normalEC, vec3(0.0, 0.0, 1.0), -normalEC);\n' +
                '    #endif\n' +

                '    materialInput.s = v_st.s;\n' +
                '    materialInput.st = v_st;\n' +
                '    materialInput.str = vec3(v_st, 0.0);\n' +
                '    materialInput.normalEC = normalEC;\n' +
                '    materialInput.tangentToEyeMatrix = czm_eastNorthUpToEyeCoordinates(v_positionMC, materialInput.normalEC);\n' +
                '    materialInput.positionToEyeEC = positionToEyeEC;\n' +

                '    czm_material material = czm_getMaterial(materialInput);\n' +

                '    #ifdef FLAT\n' +
                '        gl_FragColor = vec4(material.diffuse + material.emission, material.alpha);\n' +
                '    #else\n' +
                '        gl_FragColor = czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC);\n' +
                '        gl_FragColor.a=0.85;\n' +
                '    #endif\n' +
                '}\n';



var shader2 = {
  vertex: [
    // 顶点以及纹理
    'attribute vec3 position;',
    'attribute vec2 st;',
    'attribute float batchId;',


    // 顶点着色器的计算矩阵
    'uniform mat4 u_modelViewMatrix;',
    'uniform mat4 u_invWorldViewMatrix;',

    'uniform int u_clampToGroud;',
    'uniform vec3 u_camPos;',
    'uniform vec3 u_scale;',

    'varying vec3 vToEye;',
    'varying vec2 vUv;',
    'varying vec4 vCoord;',

    'void main(void){',
    '    vec4 positionW = u_modelViewMatrix * vec4(position.xyz, 1.0);',
    '    vec4 eyep = czm_modelView * positionW;',
    '    gl_Position = czm_projection * eyep;',
    '    if (u_clampToGroud == 1){',
    '        vToEye = (u_camPos - position.xyz) * u_scale;',
    '    } else {',
    '        vec4 pos = u_modelViewMatrix * vec4(position.xyz,1.0);',
    '        vToEye = vec3(u_invWorldViewMatrix*vec4(pos.xyz,0.0));',
    '        vCoord = gl_Position;',
    '    }',
    '    vUv = st;',
    '}'
  ].join('\n'),

  fragment:[
    'uniform sampler2D tReflectionMap;',
    'uniform sampler2D tRefractionMap;',
    'uniform sampler2D tNormalMap0;',
    'uniform sampler2D tNormalMap1;',
    'uniform sampler2D tFlowMap;',
    
    'uniform vec3 color;',
    'uniform float reflectivity;',
    'uniform vec4 config;',

    'varying vec4 vCoord;',
    'varying vec2 vUv;',
    'varying vec3 vToEye;',

    'void main() {',
    '	   float flowMapOffset0 = config.x;',
    '	   float flowMapOffset1 = config.y;',
    '	   float halfCycle = config.z;',
    '	   float scale = config.w;',

    '	   vec3 toEye = normalize( vToEye );',

    // determine flow direction
    '	   vec2 flow;',
    //'	#ifdef USE_FLOWMAP',
    //'		flow = texture2D( tFlowMap, vUv ).rg * 2.0 - 1.0;',
    '		 flow = texture2D( tFlowMap, vUv ).rg;',
    //'	#else',
    //'		flow = flowDirection;',
    //'	#endif',
    //'	flow.x *= - 1.0;',

    // sample normal maps (distort uvs with flowdata)
    '	   vec4 normalColor0 = texture2D( tNormalMap0, ( vUv * scale ) + flow * flowMapOffset0 );',
    '	   vec4 normalColor1 = texture2D( tNormalMap1, ( vUv * scale ) + flow * flowMapOffset1 );',

    '	   float flowLerp = abs( halfCycle - flowMapOffset0 ) / halfCycle;',
    '	   vec4 normalColor = mix( normalColor0, normalColor1, flowLerp );',

    '	   vec3 normal = normalize( vec3( normalColor.r * 2.0 - 1.0, normalColor.b,  normalColor.g * 2.0 - 1.0 ) );',

    // calculate the fresnel term to blend reflection and refraction maps
    '	   float theta = max( dot( toEye, normal ), 0.0 );',
    '	   float reflectance = reflectivity + ( 1.0 - reflectivity ) * pow( ( 1.0 - theta ), 5.0 );',

    // calculate final uv coords
    '	   vec3 coord = vCoord.xyz / vCoord.w;',
    '    vec2 coord1 = gl_FragCoord.xy / czm_viewport.zw;',
    '	   vec2 uv = coord1.xy + coord.z * normal.xz * 0.05;',

    '	   vec4 reflectColor = texture2D( tReflectionMap, vec2( 1.0 - uv.x, uv.y ) );',
    '	   vec4 refractColor = texture2D( tRefractionMap, uv );',

    '	   gl_FragColor = vec4( color, 1.0 ) * mix( refractColor, reflectColor, reflectance );',
    '    gl_FragColor = refractColor;',
    '}'
  ].join('\n')
};


var shader = {
  vertex: [

        '#include <common>',
        '#include <fog_pars_vertex>',
        '#include <logdepthbuf_pars_vertex>',

        'uniform mat4 textureMatrix;',

        'varying vec4 vCoord;',
        'varying vec2 vUv;',
        'varying vec3 vToEye;',

        'void main() {',

        '    vUv = uv;',
        '    vCoord = textureMatrix * vec4( position, 1.0 );',

        '    vec4 worldPosition = modelMatrix * vec4( position, 1.0 );',
        '    vToEye = cameraPosition - worldPosition.xyz;',

        '    vec4 mvPosition =  viewMatrix * worldPosition;', // used in fog_vertex
        '    gl_Position = projectionMatrix * mvPosition;',

        '    #include <logdepthbuf_vertex>',
        '    #include <fog_vertex>',

        '}'

    ].join( '\n' ),

    fragment: [

        '#include <common>',// three.js 中的 include
        '#include <fog_pars_fragment>',
        '#include <logdepthbuf_pars_fragment>',

        'uniform sampler2D tReflectionMap;',
        'uniform sampler2D tRefractionMap;',
        'uniform sampler2D tNormalMap0;',
        'uniform sampler2D tNormalMap1;',

        '#ifdef USE_FLOWMAP',
        '    uniform sampler2D tFlowMap;',
        '#else',
        '    uniform vec2 flowDirection;',
        '#endif',

        'uniform vec3 color;',
        'uniform float reflectivity;',
        'uniform vec4 config;',

        'varying vec4 vCoord;',
        'varying vec2 vUv;',
        'varying vec3 vToEye;',

        'void main() {',

        '    #include <logdepthbuf_fragment>',

        '    float flowMapOffset0 = config.x;',
        '    float flowMapOffset1 = config.y;',
        '    float halfCycle = config.z;',
        '    float scale = config.w;',

        '    vec3 toEye = normalize( vToEye );',

        // determine flow direction
        '    vec2 flow;',
        '    #ifdef USE_FLOWMAP',
        '        flow = texture2D( tFlowMap, vUv ).rg * 2.0 - 1.0;',
        '    #else',
        '        flow = flowDirection;',
        '    #endif',
        '    flow.x *= - 1.0;',

        // sample normal maps (distort uvs with flowdata)
        '    vec4 normalColor0 = texture2D( tNormalMap0, ( vUv * scale ) + flow * flowMapOffset0 );',
        '    vec4 normalColor1 = texture2D( tNormalMap1, ( vUv * scale ) + flow * flowMapOffset1 );',

        // linear interpolate to get the final normal color
        '    float flowLerp = abs( halfCycle - flowMapOffset0 ) / halfCycle;',
        '    vec4 normalColor = mix( normalColor0, normalColor1, flowLerp );',

        // calculate normal vector
        '    vec3 normal = normalize( vec3( normalColor.r * 2.0 - 1.0, normalColor.b,  normalColor.g * 2.0 - 1.0 ) );',

        // calculate the fresnel term to blend reflection and refraction maps
        '    float theta = max( dot( toEye, normal ), 0.0 );',
        '    float reflectance = reflectivity + ( 1.0 - reflectivity ) * pow( ( 1.0 - theta ), 5.0 );',

        // calculate final uv coords
        '    vec3 coord = vCoord.xyz / vCoord.w;',
        '    vec2 uv = coord.xy + coord.z * normal.xz * 0.05;',

        '    vec4 reflectColor = texture2D( tReflectionMap, vec2( 1.0 - uv.x, uv.y ) );',
        '    vec4 refractColor = texture2D( tRefractionMap, uv );',

        // multiply water color with the mix of both textures
        '    gl_FragColor = vec4( color, 1.0 ) * mix( refractColor, reflectColor, reflectance );',

        '    #include <tonemapping_fragment>',
        '    #include <encodings_fragment>',
        '    #include <fog_fragment>',

        '}'

    ].join( '\n' )
};

var appearance = new Cesium.Appearance({
  renderState: {
      blending: Cesium.BlendingState.PRE_MULTIPLIED_ALPHA_BLEND,  //混合
      depthTest: { enabled: true }, //深度测试
      depthMask: true
  }
});  

var primitives = viewer.scene.primitives.add(
  new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.RectangleGeometry({
        rectangle: Cesium.Rectangle.fromDegrees(
          -180.0,
          -90.0,
          180.0,
          90.0
        ),
        height: 1000,
        vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
      }),
    }),
    //appearance: appearance,
    appearance: new Cesium.EllipsoidSurfaceAppearance({
       aboveGround: false,
       fragmentShaderSource: shader2.fragment,
       vertexShaderSource: shader2.vertex
    }),
    show: true
  })
);

primitives.appearance.material  = new Cesium.Material({
  fabric: {
    type: "Water",
    uniforms: {
      specularMap: "images/earthspec1k.jpg",
      normalMap: Cesium.buildModuleUrl(
        "../../../Source/Assets/Textures/waterNormals.jpg"
      ),
      frequency: 10000.0,
      animationSpeed: 0.01,
      amplitude: 1.0,
    },
  },
});


