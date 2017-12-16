var Shader = (function() {
	var strVertex = `
		attribute vec2 vecPosition;

		void main() {
			gl_Position = vec4(vecPosition, 0.0, 1.0);
		}
	`;

	var strFragment = `
		precision highp float;

		#define Infinity 100000000000.0

		struct Plane {
			vec3 vecLocation;
			vec3 vecNormal;
			vec3 vecColor;
			float dblSpecular;
			float dblReflect;
		};

		struct Sphere {
			vec3 vecLocation;
			float dblRadius;
			vec3 vecColor;
			float dblSpecular;
			float dblReflect;
		};

		struct Light {
			vec3 vecLocation;
			vec3 vecIntensity;
		};

		struct Intersection {
			float dblDistance;
			vec3 vecLocation;
			vec3 vecNormal;
			vec3 vecColor;
			float dblSpecular;
			float dblReflect;
		};

		uniform int intWidth;
		uniform int intHeight;

		uniform int objectPlanes_length;
		uniform Plane objectPlanes[16];

		uniform int objectSpheres_length;
		uniform Sphere objectSpheres[16];

		uniform int objectLights_length;
		uniform Light objectLights[16];

		uniform vec3 vecAmbient;

		uniform float dblTime;

		float intersection(inout Intersection objectIntersection, inout vec3 vecOrigin, inout vec3 vecDirection, float dblMin, float dblMax) {
			float dblIntersection = Infinity;

			vecDirection = normalize(vecDirection);

			for (int intPlane = 0; intPlane < 16; intPlane += 1) {
				if (intPlane == objectPlanes_length) {
					break;
				}

				vec3 vecDifference = objectPlanes[intPlane].vecLocation - vecOrigin;

				float dblDenominator = dot(vecDirection, objectPlanes[intPlane].vecNormal);

				if (abs(dblDenominator) < 0.01) {
					continue;
				}

				float dblDistance = dot(vecDifference, objectPlanes[intPlane].vecNormal) / dblDenominator;

				if (dblDistance < dblMin) {
					continue;

				} else if (dblDistance > dblMax) {
					continue;

				} else if (dblDistance > dblIntersection) {
					continue;

				}

				if (dblIntersection == Infinity) {
					if (objectIntersection.dblDistance != 0.0) {
						return dblDistance;
					}
				}

				dblIntersection = dblDistance;

				objectIntersection.dblDistance = dblDistance;
				objectIntersection.vecLocation = vecOrigin + (dblDistance * vecDirection);
				objectIntersection.vecNormal = objectPlanes[intPlane].vecNormal;
				objectIntersection.vecColor = objectPlanes[intPlane].vecColor;
				objectIntersection.dblSpecular = objectPlanes[intPlane].dblSpecular;
				objectIntersection.dblReflect = objectPlanes[intPlane].dblReflect;

				float dblCheckerboard = mod(abs(floor(objectIntersection.vecLocation.x) + floor(objectIntersection.vecLocation.z)), 2.0);

				objectIntersection.vecColor *= 0.5 + (0.5 * dblCheckerboard);
			}

			for (int intSphere = 0; intSphere < 16; intSphere += 1) {
				if (intSphere == objectSpheres_length) {
					break;
				}

				vec3 vecDifference = vecOrigin - objectSpheres[intSphere].vecLocation;

				float dblAlpha = dot(vecDirection, vecDifference);
				float dblDiscriminant = (dblAlpha * dblAlpha) - dot(vecDifference, vecDifference) + (objectSpheres[intSphere].dblRadius * objectSpheres[intSphere].dblRadius);

				if (dblDiscriminant < 0.01) {
					continue;
				}

				float dblFirst = (-1.0 * dblAlpha) - sqrt(dblDiscriminant);
				float dblSecond = (-1.0 * dblAlpha) + sqrt(dblDiscriminant);
				float dblDistance = Infinity;

				if (dblFirst > dblMin) {
					if (dblFirst < dblMax) {
						dblDistance = min(dblDistance, dblFirst);
					}
				}

				if (dblSecond > dblMin) {
					if (dblSecond < dblMax) {
						dblDistance = min(dblDistance, dblSecond);
					}
				}

				if (dblDistance == Infinity) {
					continue;

				} else if (dblDistance > dblIntersection) {
					continue;

				}

				if (dblIntersection == Infinity) {
					if (objectIntersection.dblDistance != 0.0) {
						return dblDistance;
					}
				}

				dblIntersection = dblDistance;

				objectIntersection.dblDistance = dblDistance;
				objectIntersection.vecLocation = vecOrigin + (dblDistance * vecDirection);
				objectIntersection.vecNormal = objectIntersection.vecLocation - objectSpheres[intSphere].vecLocation;
				objectIntersection.vecColor = objectSpheres[intSphere].vecColor;
				objectIntersection.dblSpecular = objectSpheres[intSphere].dblSpecular;
				objectIntersection.dblReflect = objectSpheres[intSphere].dblReflect;
			}

			if (dblIntersection < dblMax) {
				objectIntersection.vecNormal = normalize(objectIntersection.vecNormal);
			}

			return dblIntersection;
		}

		void raytrace(inout vec3 vecColor, vec3 vecOrigin, vec3 vecDirection, float dblMin, float dblMax) {
			vecColor = vec3(0.0, 0.0, 0.0);

			float dblReflect = 1.0;

			for (int intRecurse = 0; intRecurse < 8; intRecurse += 1) {
				Intersection objectIntersection = Intersection(0.0, vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 0.0), 0.0, 0.0);

				if (intersection(objectIntersection, vecOrigin, vecDirection, dblMin, dblMax) > 10000.0) {
					break;
				}

				float dblAngle = abs(dot(vecDirection, objectIntersection.vecNormal));

				float dblSchlick = (1.0 - objectIntersection.dblReflect) + (objectIntersection.dblReflect * pow(1.0 - dblAngle, 5.0));

				for (int intLight = 0; intLight < 16; intLight += 1) {
					if (intLight == objectLights_length) {
						break;
					}

					vec3 vecLight = objectLights[intLight].vecLocation - objectIntersection.vecLocation;

					if (intersection(objectIntersection, objectIntersection.vecLocation, vecLight, 0.01, 10000.0) < 10000.0) {
						continue;
					}

					float dblDiffuse = dot(vecLight, objectIntersection.vecNormal);

					vec3 vecSpecular = vecLight - (2.0 * dblDiffuse * objectIntersection.vecNormal);

					float dblSpecular = max(0.01, pow(dot(vecDirection, vecSpecular), objectIntersection.dblSpecular));

					vecColor += dblReflect * dblSchlick * (dblDiffuse + dblSpecular) * objectIntersection.vecColor * objectLights[intLight].vecIntensity;
				}

				vecColor += dblReflect * dblSchlick * objectIntersection.vecColor * vecAmbient;

				dblReflect *= 1.0 - dblSchlick;

				if (dblReflect < 0.01) {
					break;
				}

				vecOrigin = objectIntersection.vecLocation;
				vecDirection = vecDirection - (2.0 * dot(vecDirection, objectIntersection.vecNormal) * objectIntersection.vecNormal);
				dblMin = 0.01;
				dblMax = 10000.0;
			}
		}

		void main() {
			float dblX = (gl_FragCoord.x / float(intWidth)) - 0.5;
			float dblY = (gl_FragCoord.y / float(intHeight)) - 0.5;

			vec3 vecColor = vec3(0.0, 0.0, 0.0);
			vec3 vecOrigin = vec3(6.0 * cos(dblTime), 5.0, 6.0 * sin(dblTime));
			vec3 vecDirection = vec3(0.0, 1.0, 0.0) - vecOrigin;

			vecDirection = normalize(vecDirection);

			vec3 vecRight = vec3(0.0, 0.0, 0.0);
			vec3 vecUp = vec3(0.0, 1.0, 0.0);

			vecRight = cross(vecDirection, vecUp);
			vecUp = cross(vecRight, vecDirection);

			vecDirection += (dblX * vecRight) + (dblY * vecUp);

			raytrace(vecColor, vecOrigin, vecDirection, 1.0, 10000.0);

			gl_FragColor = vec4(vecColor, 1.0);
		}
	`;

	var objectProgram = null;

	function init(objectContext) {
		objectProgram = objectContext.createProgram();

		{
			var objectShader = objectContext.createShader(objectContext.VERTEX_SHADER);

			objectContext.shaderSource(objectShader, strVertex);
			objectContext.compileShader(objectShader);
			objectContext.attachShader(objectProgram, objectShader);

			if (objectContext.getShaderInfoLog(objectShader).length > 0) {
				throw objectContext.getShaderInfoLog(objectShader);
			}
		}

		{
			var objectShader = objectContext.createShader(objectContext.FRAGMENT_SHADER);

			objectContext.shaderSource(objectShader, strFragment);
			objectContext.compileShader(objectShader);
			objectContext.attachShader(objectProgram, objectShader);

			if (objectContext.getShaderInfoLog(objectShader).length > 0) {
				throw objectContext.getShaderInfoLog(objectShader);
			}
		}

		{
			objectContext.linkProgram(objectProgram);
			objectContext.useProgram(objectProgram);
		}

		{
			objectContext.enableVertexAttribArray(objectContext.getAttribLocation(objectProgram, 'vecPosition'));
			objectContext.bindBuffer(objectContext.ARRAY_BUFFER, objectContext.createBuffer());
			objectContext.bufferData(objectContext.ARRAY_BUFFER, new Float32Array([-1.0,  1.0, -1.0, -1.0, 1.0,  1.0, 1.0,  1.0, -1.0, -1.0, 1.0, -1.0]), objectContext.STATIC_DRAW);
			objectContext.vertexAttribPointer(objectContext.getAttribLocation(objectProgram, 'vecPosition'), 2, objectContext.FLOAT, false, 0, 0);
		}

		{
			objectContext.uniform1i(objectContext.getUniformLocation(objectProgram, 'intWidth'), intWidth);
			objectContext.uniform1i(objectContext.getUniformLocation(objectProgram, 'intHeight'), intHeight);

			objectContext.uniform1i(objectContext.getUniformLocation(objectProgram, 'objectPlanes_length'), objectPlanes.length);
			for (var intPlane = 0; intPlane < objectPlanes.length; intPlane += 1) {
				objectContext.uniform3fv(objectContext.getUniformLocation(objectProgram, 'objectPlanes[' + intPlane + '].vecLocation'), objectPlanes[intPlane].vecLocation);
				objectContext.uniform3fv(objectContext.getUniformLocation(objectProgram, 'objectPlanes[' + intPlane + '].vecNormal'), objectPlanes[intPlane].vecNormal);
				objectContext.uniform3fv(objectContext.getUniformLocation(objectProgram, 'objectPlanes[' + intPlane + '].vecColor'), objectPlanes[intPlane].vecColor);
				objectContext.uniform1f(objectContext.getUniformLocation(objectProgram, 'objectPlanes[' + intPlane + '].dblSpecular'), objectPlanes[intPlane].dblSpecular);
				objectContext.uniform1f(objectContext.getUniformLocation(objectProgram, 'objectPlanes[' + intPlane + '].dblReflect'), objectPlanes[intPlane].dblReflect);
			}

			objectContext.uniform1i(objectContext.getUniformLocation(objectProgram, 'objectSpheres_length'), objectSpheres.length);
			for (var intSphere = 0; intSphere < objectSpheres.length; intSphere += 1) {
				objectContext.uniform3fv(objectContext.getUniformLocation(objectProgram, 'objectSpheres[' + intSphere + '].vecLocation'), objectSpheres[intSphere].vecLocation);
				objectContext.uniform1f(objectContext.getUniformLocation(objectProgram, 'objectSpheres[' + intSphere + '].dblRadius'), objectSpheres[intSphere].dblRadius);
				objectContext.uniform3fv(objectContext.getUniformLocation(objectProgram, 'objectSpheres[' + intSphere + '].vecColor'), objectSpheres[intSphere].vecColor);
				objectContext.uniform1f(objectContext.getUniformLocation(objectProgram, 'objectSpheres[' + intSphere + '].dblSpecular'), objectSpheres[intSphere].dblSpecular);
				objectContext.uniform1f(objectContext.getUniformLocation(objectProgram, 'objectSpheres[' + intSphere + '].dblReflect'), objectSpheres[intSphere].dblReflect);
			}

			objectContext.uniform1i(objectContext.getUniformLocation(objectProgram, 'objectLights_length'), objectLights.length);
			for (var intLight = 0; intLight < objectLights.length; intLight += 1) {
				objectContext.uniform3fv(objectContext.getUniformLocation(objectProgram, 'objectLights[' + intLight + '].vecLocation'), objectLights[intLight].vecLocation);
				objectContext.uniform3fv(objectContext.getUniformLocation(objectProgram, 'objectLights[' + intLight + '].vecIntensity'), objectLights[intLight].vecIntensity);
			}

			objectContext.uniform3fv(objectContext.getUniformLocation(objectProgram, 'vecAmbient'), vecAmbient);
		}
	}

	function render(objectContext) {
		if (objectProgram === null) {
			init(objectContext);
		}

		objectContext.uniform1f(objectContext.getUniformLocation(objectProgram, 'dblTime'), dblTime);

		objectContext.clearColor(0.0, 0.0, 0.0, 1.0);
		objectContext.clear(objectContext.COLOR_BUFFER_BIT);
		objectContext.drawArrays(objectContext.TRIANGLES, 0, 6);
	}

	return {
		'render': render
	}
})();