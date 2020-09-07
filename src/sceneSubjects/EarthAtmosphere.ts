import {
  Scene,
  BackSide,
  Mesh,
  ShaderMaterial,
  Color,
  AdditiveBlending,
  SphereBufferGeometry
} from "three";

export class EarthAtmosphere {
  private scene: Scene;
  private sphereGeometry: SphereBufferGeometry;
  earthAtmosphere: Mesh<SphereBufferGeometry, ShaderMaterial>;

  constructor(scene: Scene, sphereGeometry: SphereBufferGeometry) {
      this.scene = scene;
      this.sphereGeometry = sphereGeometry;
      
      this.earthAtmosphere = this.createEarthAtmosphere();
  }


  private createEarthAtmosphere() {
      const atmosphereGeometry = this.sphereGeometry.clone();
      const atmosphereMaterial = this.createAtmosphereMaterial();
      atmosphereMaterial.side = BackSide;

      const atmosphereMesh = new Mesh(
          atmosphereGeometry,
          atmosphereMaterial
      );
      atmosphereMesh.scale.multiplyScalar(1.1);
      this.scene.add(atmosphereMesh);

      return atmosphereMesh;
  }

  /**
   * from http://stemkoski.blogspot.fr/2013/07/shaders-in-threejs-glow-and-halo.html
   */
  private createAtmosphereMaterial() {
      const vertexShader = [
          "varying vec3 vVertexWorldPosition;",
          "varying vec3 vVertexNormal;",

          "void main(){",
          " vVertexNormal = normalize(normalMatrix * normal);",

          " vVertexWorldPosition  = (modelMatrix * vec4(position, 1.0)).xyz;",

          " // set gl_Position",
          " gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
          "}",
      ].join("\n");
      const fragmentShader = [
          "uniform vec3 glowColor;",
          "uniform float  coeficient;",
          "uniform float  power;",

          "varying vec3 vVertexNormal;",
          "varying vec3 vVertexWorldPosition;",

          "void main(){",
          " vec3 worldCameraToVertex= vVertexWorldPosition - cameraPosition;",
          " vec3 viewCameraToVertex = (viewMatrix * vec4(worldCameraToVertex, 0.0)).xyz;",
          " viewCameraToVertex  = normalize(viewCameraToVertex);",
          " float intensity   = pow(coeficient + dot(vVertexNormal, viewCameraToVertex), power);",
          " gl_FragColor    = vec4(glowColor, intensity);",
          "}",
      ].join("\n");

      const material = new ShaderMaterial({
          uniforms: {
              coeficient: {
                  value: 0.35,
              },
              power: {
                  value: 6,
              },
              glowColor: {
                  value: new Color(0xffffff),
              },
          },
          vertexShader: vertexShader,
          fragmentShader: fragmentShader,
          blending: AdditiveBlending,
          transparent: true,
          depthWrite: false,
      });

      return material;
  }
}