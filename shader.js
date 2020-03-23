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
			float fltSpecular;
			float fltReflect;
		};

		struct Sphere {
			vec3 vecLocation;
			float fltRadius;
			vec3 vecColor;
			float fltSpecular;
			float fltReflect;
		};

		struct Light {
			vec3 vecLocation;
			vec3 vecIntensity;
		};

		struct Intersection {
			float fltDistance;
			vec3 vecLocation;
			vec3 vecNormal;
			vec3 vecColor;
			float fltSpecular;
			float fltReflect;
		};

		uniform int intWidth;
		uniform int intHeight;

		uniform int objPlanes_length;
		uniform Plane objPlanes[16];

		uniform int objSpheres_length;
		uniform Sphere objSpheres[16];

		uniform int objLights_length;
		uniform Light objLights[16];

		uniform vec3 vecAmbient;

		uniform float fltTime;

		float intersection(inout Intersection objIntersection, inout vec3 vecOrigin, inout vec3 vecDirection, float fltMin, float fltMax, bool boolPeek) {
			float fltIntersection = Infinity;

			vecDirection = normalize(vecDirection);

			for (int intPlane = 0; intPlane < 16; intPlane += 1) {
				if (intPlane == objPlanes_length) {
					break;
				}

				vec3 vecDifference = objPlanes[intPlane].vecLocation - vecOrigin;

				float fltDenominator = dot(vecDirection, objPlanes[intPlane].vecNormal);

				if (abs(fltDenominator) < 0.01) {
					continue;
				}

				float fltDistance = dot(vecDifference, objPlanes[intPlane].vecNormal) / fltDenominator;

				if (fltDistance < fltMin) {
					continue;

				} else if (fltDistance > fltMax) {
					continue;

				} else if (fltDistance > fltIntersection) {
					continue;

				}

				if (boolPeek == true) {
					return fltDistance;
				}

				fltIntersection = fltDistance;

				objIntersection.fltDistance = fltDistance;
				objIntersection.vecLocation = vecOrigin + (fltDistance * vecDirection);
				objIntersection.vecNormal = objPlanes[intPlane].vecNormal;
				objIntersection.vecColor = objPlanes[intPlane].vecColor;
				objIntersection.fltSpecular = objPlanes[intPlane].fltSpecular;
				objIntersection.fltReflect = objPlanes[intPlane].fltReflect;

				float fltCheckerboard = mod(abs(floor(objIntersection.vecLocation.x) + floor(objIntersection.vecLocation.z)), 2.0);

				objIntersection.vecColor *= 0.5 + (0.5 * fltCheckerboard);
			}

			for (int intSphere = 0; intSphere < 16; intSphere += 1) {
				if (intSphere == objSpheres_length) {
					break;
				}

				vec3 vecDifference = vecOrigin - objSpheres[intSphere].vecLocation;

				float fltAlpha = dot(vecDirection, vecDifference);
				float fltDiscriminant = (fltAlpha * fltAlpha) - dot(vecDifference, vecDifference) + (objSpheres[intSphere].fltRadius * objSpheres[intSphere].fltRadius);

				if (fltDiscriminant < 0.01) {
					continue;
				}

				float fltFirst = (-1.0 * fltAlpha) - sqrt(fltDiscriminant);
				float fltSecond = (-1.0 * fltAlpha) + sqrt(fltDiscriminant);
				float fltDistance = Infinity;

				if (fltFirst > fltMin) {
					if (fltFirst < fltMax) {
						fltDistance = min(fltDistance, fltFirst);
					}
				}

				if (fltSecond > fltMin) {
					if (fltSecond < fltMax) {
						fltDistance = min(fltDistance, fltSecond);
					}
				}

				if (fltDistance == Infinity) {
					continue;

				} else if (fltDistance > fltIntersection) {
					continue;

				}

				if (boolPeek == true) {
					return fltDistance;
				}

				fltIntersection = fltDistance;

				objIntersection.fltDistance = fltDistance;
				objIntersection.vecLocation = vecOrigin + (fltDistance * vecDirection);
				objIntersection.vecNormal = objIntersection.vecLocation - objSpheres[intSphere].vecLocation;
				objIntersection.vecColor = objSpheres[intSphere].vecColor;
				objIntersection.fltSpecular = objSpheres[intSphere].fltSpecular;
				objIntersection.fltReflect = objSpheres[intSphere].fltReflect;
			}

			if (boolPeek != true) {
				if (fltIntersection < fltMax) {
					objIntersection.vecNormal = normalize(objIntersection.vecNormal);
				}
			}

			return fltIntersection;
		}

		void raytrace(inout vec3 vecColor, vec3 vecOrigin, vec3 vecDirection, float fltMin, float fltMax) {
			vecColor = vec3(0.0, 0.0, 0.0);

			float fltReflect = 1.0;

			for (int intRecurse = 0; intRecurse < 8; intRecurse += 1) {
				Intersection objIntersection = Intersection(0.0, vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 0.0), 0.0, 0.0);

				if (intersection(objIntersection, vecOrigin, vecDirection, fltMin, fltMax, false) > 10000.0) {
					break;
				}

				float fltAngle = abs(dot(vecDirection, objIntersection.vecNormal));

				float fltSchlick = (1.0 - objIntersection.fltReflect) + (objIntersection.fltReflect * pow(1.0 - fltAngle, 5.0));

				for (int intLight = 0; intLight < 16; intLight += 1) {
					if (intLight == objLights_length) {
						break;
					}

					vec3 vecLight = objLights[intLight].vecLocation - objIntersection.vecLocation;

					if (intersection(objIntersection, objIntersection.vecLocation, vecLight, 0.01, 10000.0, true) < 10000.0) {
						continue;
					}

					float fltDiffuse = dot(vecLight, objIntersection.vecNormal);

					vec3 vecSpecular = vecLight - (2.0 * fltDiffuse * objIntersection.vecNormal);

					float fltSpecular = max(0.01, pow(dot(vecDirection, vecSpecular), objIntersection.fltSpecular));

					vecColor += fltReflect * fltSchlick * (fltDiffuse + fltSpecular) * objIntersection.vecColor * objLights[intLight].vecIntensity;
				}

				vecColor += fltReflect * fltSchlick * objIntersection.vecColor * vecAmbient;

				fltReflect *= 1.0 - fltSchlick;

				if (fltReflect < 0.01) {
					break;
				}

				vecOrigin = objIntersection.vecLocation;
				vecDirection = vecDirection - (2.0 * dot(vecDirection, objIntersection.vecNormal) * objIntersection.vecNormal);
				fltMin = 0.01;
				fltMax = 10000.0;
			}
		}

		void main() {
			float fltX = (gl_FragCoord.x / float(intWidth)) - 0.5;
			float fltY = (gl_FragCoord.y / float(intHeight)) - 0.5;

			vec3 vecColor = vec3(0.0, 0.0, 0.0);
			vec3 vecOrigin = vec3(6.0 * cos(fltTime), 5.0, 6.0 * sin(fltTime));
			vec3 vecDirection = vec3(0.0, 1.0, 0.0) - vecOrigin;

			vecDirection = normalize(vecDirection);

			vec3 vecRight = vec3(0.0, 0.0, 0.0);
			vec3 vecUp = vec3(0.0, 1.0, 0.0);

			vecRight = cross(vecDirection, vecUp);
			vecUp = cross(vecRight, vecDirection);

			vecDirection += (fltX * vecRight) + (fltY * vecUp);

			raytrace(vecColor, vecOrigin, vecDirection, 1.0, 10000.0);

			gl_FragColor = vec4(vecColor, 1.0);
		}
	`;

	var objProgram = null;

	function init(objContext) {
		objProgram = objContext.createProgram();

		var objVertexshader = objContext.createShader(objContext.VERTEX_SHADER);
		objContext.shaderSource(objVertexshader, strVertex);
		objContext.compileShader(objVertexshader);
		objContext.attachShader(objProgram, objVertexshader);
		if (objContext.getShaderInfoLog(objVertexshader).length > 0) {
			throw objContext.getShaderInfoLog(objVertexshader);
		}

		var objFragmentshader = objContext.createShader(objContext.FRAGMENT_SHADER);
		objContext.shaderSource(objFragmentshader, strFragment);
		objContext.compileShader(objFragmentshader);
		objContext.attachShader(objProgram, objFragmentshader);
		if (objContext.getShaderInfoLog(objFragmentshader).length > 0) {
			throw objContext.getShaderInfoLog(objFragmentshader);
		}

		objContext.linkProgram(objProgram);
		objContext.useProgram(objProgram);

		objContext.enableVertexAttribArray(objContext.getAttribLocation(objProgram, 'vecPosition'));
		objContext.bindBuffer(objContext.ARRAY_BUFFER, objContext.createBuffer());
		objContext.bufferData(objContext.ARRAY_BUFFER, new Float32Array([ -1.0,  1.0, -1.0, -1.0, 1.0,  1.0, 1.0,  1.0, -1.0, -1.0, 1.0, -1.0 ]), objContext.STATIC_DRAW);
		objContext.vertexAttribPointer(objContext.getAttribLocation(objProgram, 'vecPosition'), 2, objContext.FLOAT, false, 0, 0);

		objContext.uniform1i(objContext.getUniformLocation(objProgram, 'intWidth'), intWidth);
		objContext.uniform1i(objContext.getUniformLocation(objProgram, 'intHeight'), intHeight);

		objContext.uniform1i(objContext.getUniformLocation(objProgram, 'objPlanes_length'), objPlanes.length);
		for (var intPlane = 0; intPlane < objPlanes.length; intPlane += 1) {
			objContext.uniform3fv(objContext.getUniformLocation(objProgram, 'objPlanes[' + intPlane + '].vecLocation'), objPlanes[intPlane].vecLocation);
			objContext.uniform3fv(objContext.getUniformLocation(objProgram, 'objPlanes[' + intPlane + '].vecNormal'), objPlanes[intPlane].vecNormal);
			objContext.uniform3fv(objContext.getUniformLocation(objProgram, 'objPlanes[' + intPlane + '].vecColor'), objPlanes[intPlane].vecColor);
			objContext.uniform1f(objContext.getUniformLocation(objProgram, 'objPlanes[' + intPlane + '].fltSpecular'), objPlanes[intPlane].fltSpecular);
			objContext.uniform1f(objContext.getUniformLocation(objProgram, 'objPlanes[' + intPlane + '].fltReflect'), objPlanes[intPlane].fltReflect);
		}

		objContext.uniform1i(objContext.getUniformLocation(objProgram, 'objSpheres_length'), objSpheres.length);
		for (var intSphere = 0; intSphere < objSpheres.length; intSphere += 1) {
			objContext.uniform3fv(objContext.getUniformLocation(objProgram, 'objSpheres[' + intSphere + '].vecLocation'), objSpheres[intSphere].vecLocation);
			objContext.uniform1f(objContext.getUniformLocation(objProgram, 'objSpheres[' + intSphere + '].fltRadius'), objSpheres[intSphere].fltRadius);
			objContext.uniform3fv(objContext.getUniformLocation(objProgram, 'objSpheres[' + intSphere + '].vecColor'), objSpheres[intSphere].vecColor);
			objContext.uniform1f(objContext.getUniformLocation(objProgram, 'objSpheres[' + intSphere + '].fltSpecular'), objSpheres[intSphere].fltSpecular);
			objContext.uniform1f(objContext.getUniformLocation(objProgram, 'objSpheres[' + intSphere + '].fltReflect'), objSpheres[intSphere].fltReflect);
		}

		objContext.uniform1i(objContext.getUniformLocation(objProgram, 'objLights_length'), objLights.length);
		for (var intLight = 0; intLight < objLights.length; intLight += 1) {
			objContext.uniform3fv(objContext.getUniformLocation(objProgram, 'objLights[' + intLight + '].vecLocation'), objLights[intLight].vecLocation);
			objContext.uniform3fv(objContext.getUniformLocation(objProgram, 'objLights[' + intLight + '].vecIntensity'), objLights[intLight].vecIntensity);
		}

		objContext.uniform3fv(objContext.getUniformLocation(objProgram, 'vecAmbient'), vecAmbient);
	}

	function render(objContext) {
		if (objProgram === null) {
			init(objContext);
		}

		objContext.uniform1f(objContext.getUniformLocation(objProgram, 'fltTime'), fltTime);

		objContext.clearColor(0.0, 0.0, 0.0, 1.0);
		objContext.clear(objContext.COLOR_BUFFER_BIT);
		objContext.drawArrays(objContext.TRIANGLES, 0, 6);
	}

	return {
		'render': render
	}
})();
