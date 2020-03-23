var Javascript = (function() {
	function dot(vecA, vecB) {
		return (vecA[0] * vecB[0]) + (vecA[1] * vecB[1]) + (vecA[2] * vecB[2]);
	}

	function length(vecA) {
		return Math.sqrt(dot(vecA, vecA));
	}

	function normalize(vecA) {
		var fltLength = Math.max(0.00001, length(vecA));

		vecA[0] /= fltLength;
		vecA[1] /= fltLength;
		vecA[2] /= fltLength;
	}

	function cross(vecA, vecB, vecC) {
		vecA[0] = (vecB[1] * vecC[2]) - (vecB[2] * vecC[1]);
		vecA[1] = (vecB[2] * vecC[0]) - (vecB[0] * vecC[2]);
		vecA[2] = (vecB[0] * vecC[1]) - (vecB[1] * vecC[0]);
	}

	function intersection(objIntersection, vecOrigin, vecDirection, fltMin, fltMax, boolPeek) {
		var fltIntersection = Infinity;

		normalize(vecDirection);

		for (var intPlane = 0; intPlane < objPlanes.length; intPlane += 1) {
			var vecDifference = [ 0.0, 0.0, 0.0 ];

			vecDifference[0] = objPlanes[intPlane].vecLocation[0] - vecOrigin[0];
			vecDifference[1] = objPlanes[intPlane].vecLocation[1] - vecOrigin[1];
			vecDifference[2] = objPlanes[intPlane].vecLocation[2] - vecOrigin[2];

			var fltDenominator = dot(vecDirection, objPlanes[intPlane].vecNormal);

			if (Math.abs(fltDenominator) < 0.01) {
				continue;
			}

			var fltDistance = dot(vecDifference, objPlanes[intPlane].vecNormal) / fltDenominator;

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

			objIntersection.vecLocation = [ 0.0, 0.0, 0.0 ];
			objIntersection.vecLocation[0] = vecOrigin[0] + (fltDistance * vecDirection[0]);
			objIntersection.vecLocation[1] = vecOrigin[1] + (fltDistance * vecDirection[1]);
			objIntersection.vecLocation[2] = vecOrigin[2] + (fltDistance * vecDirection[2]);

			objIntersection.vecNormal = [ 0.0, 0.0, 0.0 ];
			objIntersection.vecNormal[0] = objPlanes[intPlane].vecNormal[0];
			objIntersection.vecNormal[1] = objPlanes[intPlane].vecNormal[1];
			objIntersection.vecNormal[2] = objPlanes[intPlane].vecNormal[2];

			objIntersection.vecColor = [ 0.0, 0.0, 0.0 ];
			objIntersection.vecColor[0] = objPlanes[intPlane].vecColor[0];
			objIntersection.vecColor[1] = objPlanes[intPlane].vecColor[1];
			objIntersection.vecColor[2] = objPlanes[intPlane].vecColor[2];

			objIntersection.fltSpecular = objPlanes[intPlane].fltSpecular;

			objIntersection.fltReflect = objPlanes[intPlane].fltReflect;

			var fltCheckerboard = Math.abs(Math.floor(objIntersection.vecLocation[0]) + Math.floor(objIntersection.vecLocation[2])) % 2.0;

			objIntersection.vecColor[0] *= 0.5 + (0.5 * fltCheckerboard);
			objIntersection.vecColor[1] *= 0.5 + (0.5 * fltCheckerboard);
			objIntersection.vecColor[2] *= 0.5 + (0.5 * fltCheckerboard);
		}

		for (var intSphere = 0; intSphere < objSpheres.length; intSphere += 1) {
			var vecDifference = [ 0.0, 0.0, 0.0 ];

			vecDifference[0] = vecOrigin[0] - objSpheres[intSphere].vecLocation[0];
			vecDifference[1] = vecOrigin[1] - objSpheres[intSphere].vecLocation[1];
			vecDifference[2] = vecOrigin[2] - objSpheres[intSphere].vecLocation[2];

			var fltAlpha = dot(vecDirection, vecDifference);
			var fltDiscriminant = (fltAlpha * fltAlpha) - dot(vecDifference, vecDifference) + (objSpheres[intSphere].fltRadius * objSpheres[intSphere].fltRadius);

			if (fltDiscriminant < 0.01) {
				continue;
			}

			var fltFirst = (-1.0 * fltAlpha) - Math.sqrt(fltDiscriminant);
			var fltSecond = (-1.0 * fltAlpha) + Math.sqrt(fltDiscriminant);
			var fltDistance = Infinity;

			if (fltFirst > fltMin) {
				if (fltFirst < fltMax) {
					fltDistance = Math.min(fltDistance, fltFirst);
				}
			}

			if (fltSecond > fltMin) {
				if (fltSecond < fltMax) {
					fltDistance = Math.min(fltDistance, fltSecond);
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

			objIntersection.vecLocation = [ 0.0, 0.0, 0.0 ];
			objIntersection.vecLocation[0] = vecOrigin[0] + (fltDistance * vecDirection[0]);
			objIntersection.vecLocation[1] = vecOrigin[1] + (fltDistance * vecDirection[1]);
			objIntersection.vecLocation[2] = vecOrigin[2] + (fltDistance * vecDirection[2]);

			objIntersection.vecNormal = [ 0.0, 0.0, 0.0 ];
			objIntersection.vecNormal[0] = objIntersection.vecLocation[0] - objSpheres[intSphere].vecLocation[0];
			objIntersection.vecNormal[1] = objIntersection.vecLocation[1] - objSpheres[intSphere].vecLocation[1];
			objIntersection.vecNormal[2] = objIntersection.vecLocation[2] - objSpheres[intSphere].vecLocation[2];

			objIntersection.vecColor = [ 0.0, 0.0, 0.0 ];
			objIntersection.vecColor[0] = objSpheres[intSphere].vecColor[0];
			objIntersection.vecColor[1] = objSpheres[intSphere].vecColor[1];
			objIntersection.vecColor[2] = objSpheres[intSphere].vecColor[2];

			objIntersection.fltSpecular = objSpheres[intSphere].fltSpecular;

			objIntersection.fltReflect = objSpheres[intSphere].fltReflect;
		}

		if (boolPeek != true) {
			if (fltIntersection < fltMax) {
				normalize(objIntersection.vecNormal);
			}
		}

		return fltIntersection;
	}

	function raytrace(vecColor, vecOrigin, vecDirection, fltMin, fltMax) {
		vecColor[0] = 0.0;
		vecColor[1] = 0.0;
		vecColor[2] = 0.0;

		var fltReflect = 1.0;

		for (var intRecurse = 0; intRecurse < 8; intRecurse += 1) {
			var objIntersection = {};

			if (intersection(objIntersection, vecOrigin, vecDirection, fltMin, fltMax, false) > 10000.0) {
				return;
			}

			var fltAngle = Math.abs(dot(vecDirection, objIntersection.vecNormal));

			var fltSchlick = (1.0 - objIntersection.fltReflect) + (objIntersection.fltReflect * Math.pow(1.0 - fltAngle, 5.0));

			for (var intLight = 0; intLight < objLights.length; intLight += 1) {
				var vecLight = [ 0.0, 0.0, 0.0 ];

				vecLight[0] = objLights[intLight].vecLocation[0] - objIntersection.vecLocation[0];
				vecLight[1] = objLights[intLight].vecLocation[1] - objIntersection.vecLocation[1];
				vecLight[2] = objLights[intLight].vecLocation[2] - objIntersection.vecLocation[2];

				if (intersection(objIntersection, objIntersection.vecLocation, vecLight, 0.01, 10000.0, true) < 10000.0) {
					continue;
				}

				var fltDiffuse = dot(vecLight, objIntersection.vecNormal);

				var vecSpecular = [ 0.0, 0.0, 0.0 ];

				vecSpecular[0] = vecLight[0] - (2.0 * fltDiffuse * objIntersection.vecNormal[0]);
				vecSpecular[1] = vecLight[1] - (2.0 * fltDiffuse * objIntersection.vecNormal[1]);
				vecSpecular[2] = vecLight[2] - (2.0 * fltDiffuse * objIntersection.vecNormal[2]);

				var fltSpecular = Math.max(0.01, Math.pow(dot(vecDirection, vecSpecular), objIntersection.fltSpecular));

				vecColor[0] += fltReflect * fltSchlick * (fltDiffuse + fltSpecular) * objIntersection.vecColor[0] * objLights[intLight].vecIntensity[0];
				vecColor[1] += fltReflect * fltSchlick * (fltDiffuse + fltSpecular) * objIntersection.vecColor[1] * objLights[intLight].vecIntensity[1];
				vecColor[2] += fltReflect * fltSchlick * (fltDiffuse + fltSpecular) * objIntersection.vecColor[2] * objLights[intLight].vecIntensity[2];
			}

			vecColor[0] += fltReflect * fltSchlick * objIntersection.vecColor[0] * vecAmbient[0];
			vecColor[1] += fltReflect * fltSchlick * objIntersection.vecColor[1] * vecAmbient[1];
			vecColor[2] += fltReflect * fltSchlick * objIntersection.vecColor[2] * vecAmbient[2];

			fltReflect *= 1.0 - fltSchlick;

			if (fltReflect < 0.01) {
				break;
			}

			var fltReflection = dot(vecDirection, objIntersection.vecNormal);

			vecOrigin[0] = objIntersection.vecLocation[0];
			vecOrigin[1] = objIntersection.vecLocation[1];
			vecOrigin[2] = objIntersection.vecLocation[2];

			vecDirection[0] = vecDirection[0] - (2.0 * fltReflection * objIntersection.vecNormal[0]);
			vecDirection[1] = vecDirection[1] - (2.0 * fltReflection * objIntersection.vecNormal[1]);
			vecDirection[2] = vecDirection[2] - (2.0 * fltReflection * objIntersection.vecNormal[2]);

			fltMin = 0.01;

			fltMax = 10000.0;
		}
	}

	function render(charPixels) {
		for (var intY = 0; intY < intHeight; intY += 1) {
			for (var intX = 0; intX < intWidth; intX += 1) {
				var fltX = (intX / intWidth) - 0.5;
				var fltY = 0.5 - (intY / intHeight);

				var vecColor = [ 0.0, 0.0, 0.0 ];
				var vecOrigin = [ 6.0 * Math.cos(fltTime), 5.0, 6.0 * Math.sin(fltTime) ];
				var vecDirection = [ 0.0 - vecOrigin[0], 1.0 - vecOrigin[1], 0.0 - vecOrigin[2] ];

				normalize(vecDirection);

				var vecRight = [ 0.0, 0.0, 0.0 ];
				var vecUp = [ 0.0, 1.0, 0.0 ];

				cross(vecRight, vecDirection, vecUp);
				cross(vecUp, vecRight, vecDirection);

				vecDirection[0] += (fltX * vecRight[0]) + (fltY * vecUp[0]);
				vecDirection[1] += (fltX * vecRight[1]) + (fltY * vecUp[1]);
				vecDirection[2] += (fltX * vecRight[2]) + (fltY * vecUp[2]);

				raytrace(vecColor, vecOrigin, vecDirection, 1.0, 10000.0);

				charPixels[(intY * intWidth * 4) + (intX * 4) + 0] = Math.min(255.0, 255.0 * vecColor[0]);
				charPixels[(intY * intWidth * 4) + (intX * 4) + 1] = Math.min(255.0, 255.0 * vecColor[1]);
				charPixels[(intY * intWidth * 4) + (intX * 4) + 2] = Math.min(255.0, 255.0 * vecColor[2]);
				charPixels[(intY * intWidth * 4) + (intX * 4) + 3] = 255;
			}
		}
	}

	return {
		'render': render
	}
})();
