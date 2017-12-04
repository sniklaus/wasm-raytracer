var Javascript = (function() {
	function dot(vecA, vecB) {
		return (vecA[0] * vecB[0]) + (vecA[1] * vecB[1]) + (vecA[2] * vecB[2]);
	}

	function length(vecA) {
		return Math.sqrt(dot(vecA, vecA));
	}

	function normalize(vecA) {
		var dblLength = Math.max(0.00001, length(vecA));

		vecA[0] /= dblLength;
		vecA[1] /= dblLength;
		vecA[2] /= dblLength;
	}

	function cross(vecA, vecB, vecC) {
		vecA[0] = (vecB[1] * vecC[2]) - (vecB[2] * vecC[1]);
		vecA[1] = (vecB[2] * vecC[0]) - (vecB[0] * vecC[2]);
		vecA[2] = (vecB[0] * vecC[1]) - (vecB[1] * vecC[0]);
	}

	function intersection(objectIntersection, vecOrigin, vecDirection, dblMin, dblMax) {
		var dblIntersection = Infinity;

		normalize(vecDirection);

		for (var intPlane = 0; intPlane < objectPlanes.length; intPlane += 1) {
			var vecDifference = [0.0, 0.0, 0.0];

			vecDifference[0] = objectPlanes[intPlane].vecLocation[0] - vecOrigin[0];
			vecDifference[1] = objectPlanes[intPlane].vecLocation[1] - vecOrigin[1];
			vecDifference[2] = objectPlanes[intPlane].vecLocation[2] - vecOrigin[2];

			var dblDenominator = dot(vecDirection, objectPlanes[intPlane].vecNormal);

			if (Math.abs(dblDiscriminant) < 0.01) {
				continue;
			}

			var dblDistance = dot(vecDifference, objectPlanes[intPlane].vecNormal) / dblDenominator;

			if (dblDistance < dblMin) {
				continue;

			} else if (dblDistance > dblMax) {
				continue;

			} else if (dblDistance > dblIntersection) {
				continue;

			}

			if (dblIntersection == Infinity) {
				if (objectIntersection.hasOwnProperty('dblDistance') == true) {
					return dblDistance;
				}
			}

			dblIntersection = dblDistance;

			objectIntersection.dblDistance = dblDistance;

			objectIntersection.vecLocation = [0.0, 0.0, 0.0];
			objectIntersection.vecLocation[0] = vecOrigin[0] + (dblDistance * vecDirection[0]);
			objectIntersection.vecLocation[1] = vecOrigin[1] + (dblDistance * vecDirection[1]);
			objectIntersection.vecLocation[2] = vecOrigin[2] + (dblDistance * vecDirection[2]);

			objectIntersection.vecNormal = [0.0, 0.0, 0.0];
			objectIntersection.vecNormal[0] = objectPlanes[intPlane].vecNormal[0];
			objectIntersection.vecNormal[1] = objectPlanes[intPlane].vecNormal[1];
			objectIntersection.vecNormal[2] = objectPlanes[intPlane].vecNormal[2];

			objectIntersection.vecColor = [0.0, 0.0, 0.0];
			objectIntersection.vecColor[0] = objectPlanes[intPlane].vecColor[0];
			objectIntersection.vecColor[1] = objectPlanes[intPlane].vecColor[1];
			objectIntersection.vecColor[2] = objectPlanes[intPlane].vecColor[2];

			objectIntersection.dblSpecular = objectPlanes[intPlane].dblSpecular;

			objectIntersection.dblReflect = objectPlanes[intPlane].dblReflect;

			var dblCheckerboard = Math.abs(Math.floor(objectIntersection.vecLocation[0]) + Math.floor(objectIntersection.vecLocation[2])) % 2.0;

			objectIntersection.vecColor[0] *= 0.5 + (0.5 * dblCheckerboard);
			objectIntersection.vecColor[1] *= 0.5 + (0.5 * dblCheckerboard);
			objectIntersection.vecColor[2] *= 0.5 + (0.5 * dblCheckerboard);
		}

		for (var intSphere = 0; intSphere < objectSpheres.length; intSphere += 1) {
			var vecDifference = [0.0, 0.0, 0.0];

			vecDifference[0] = vecOrigin[0] - objectSpheres[intSphere].vecLocation[0];
			vecDifference[1] = vecOrigin[1] - objectSpheres[intSphere].vecLocation[1];
			vecDifference[2] = vecOrigin[2] - objectSpheres[intSphere].vecLocation[2];

			var dblAlpha = dot(vecDirection, vecDifference);
			var dblDiscriminant = (dblAlpha * dblAlpha) - dot(vecDifference, vecDifference) + (objectSpheres[intSphere].dblRadius * objectSpheres[intSphere].dblRadius);

			if (dblDiscriminant < 0.01) {
				continue;
			}

			var dblFirst = (-1.0 * dblAlpha) - Math.sqrt(dblDiscriminant);
			var dblSecond = (-1.0 * dblAlpha) + Math.sqrt(dblDiscriminant);
			var dblDistance = Infinity;

			if (dblFirst > dblMin) {
				if (dblFirst < dblMax) {
					dblDistance = Math.min(dblDistance, dblFirst);
				}
			}

			if (dblSecond > dblMin) {
				if (dblSecond < dblMax) {
					dblDistance = Math.min(dblDistance, dblSecond);
				}
			}

			if (dblDistance == Infinity) {
				continue;

			} else if (dblDistance > dblIntersection) {
				continue;

			}

			if (dblIntersection == Infinity) {
				if (objectIntersection.hasOwnProperty('dblDistance') == true) {
					return dblDistance;
				}
			}

			dblIntersection = dblDistance;

			objectIntersection.dblDistance = dblDistance;

			objectIntersection.vecLocation = [0.0, 0.0, 0.0];
			objectIntersection.vecLocation[0] = vecOrigin[0] + (dblDistance * vecDirection[0]);
			objectIntersection.vecLocation[1] = vecOrigin[1] + (dblDistance * vecDirection[1]);
			objectIntersection.vecLocation[2] = vecOrigin[2] + (dblDistance * vecDirection[2]);

			objectIntersection.vecNormal = [0.0, 0.0, 0.0];
			objectIntersection.vecNormal[0] = objectIntersection.vecLocation[0] - objectSpheres[intSphere].vecLocation[0];
			objectIntersection.vecNormal[1] = objectIntersection.vecLocation[1] - objectSpheres[intSphere].vecLocation[1];
			objectIntersection.vecNormal[2] = objectIntersection.vecLocation[2] - objectSpheres[intSphere].vecLocation[2];

			objectIntersection.vecColor = [0.0, 0.0, 0.0];
			objectIntersection.vecColor[0] = objectSpheres[intSphere].vecColor[0];
			objectIntersection.vecColor[1] = objectSpheres[intSphere].vecColor[1];
			objectIntersection.vecColor[2] = objectSpheres[intSphere].vecColor[2];

			objectIntersection.dblSpecular = objectSpheres[intSphere].dblSpecular;

			objectIntersection.dblReflect = objectSpheres[intSphere].dblReflect;
		}

		if (dblIntersection < dblMax) {
			normalize(objectIntersection.vecNormal);
		}

		return dblIntersection;
	}

	function raytrace(vecColor, vecOrigin, vecDirection, dblMin, dblMax) {
		vecColor[0] = 0.0;
		vecColor[1] = 0.0;
		vecColor[2] = 0.0;

		var dblReflect = 1.0;

		for (var intRecurse = 0; intRecurse < 8; intRecurse += 1) {
			var objectIntersection = {};

			if (intersection(objectIntersection, vecOrigin, vecDirection, dblMin, dblMax) > 10000.0) {
				return;
			}

			var dblAngle = Math.abs(dot(vecDirection, objectIntersection.vecNormal));

			var dblSchlick = (1.0 - objectIntersection.dblReflect) + (objectIntersection.dblReflect * Math.pow(1.0 - dblAngle, 5.0));

			for (var intLight = 0; intLight < objectLights.length; intLight += 1) {
				var vecLight = [0.0, 0.0, 0.0];

				vecLight[0] = objectLights[intLight].vecLocation[0] - objectIntersection.vecLocation[0];
				vecLight[1] = objectLights[intLight].vecLocation[1] - objectIntersection.vecLocation[1];
				vecLight[2] = objectLights[intLight].vecLocation[2] - objectIntersection.vecLocation[2];

				if (intersection(objectIntersection, objectIntersection.vecLocation, vecLight, 0.01, 10000.0) < 10000.0) {
					continue;
				}

				var dblDiffuse = dot(vecLight, objectIntersection.vecNormal);

				var vecSpecular = [0.0, 0.0, 0.0];

				vecSpecular[0] = vecLight[0] - (2.0 * dblDiffuse * objectIntersection.vecNormal[0]);
				vecSpecular[1] = vecLight[1] - (2.0 * dblDiffuse * objectIntersection.vecNormal[1]);
				vecSpecular[2] = vecLight[2] - (2.0 * dblDiffuse * objectIntersection.vecNormal[2]);

				var dblSpecular = Math.max(0.01, Math.pow(dot(vecDirection, vecSpecular), objectIntersection.dblSpecular));

				vecColor[0] += dblReflect * dblSchlick * (dblDiffuse + dblSpecular) * objectIntersection.vecColor[0] * objectLights[intLight].vecIntensity[0];
				vecColor[1] += dblReflect * dblSchlick * (dblDiffuse + dblSpecular) * objectIntersection.vecColor[1] * objectLights[intLight].vecIntensity[1];
				vecColor[2] += dblReflect * dblSchlick * (dblDiffuse + dblSpecular) * objectIntersection.vecColor[2] * objectLights[intLight].vecIntensity[2];
			}

			vecColor[0] += dblReflect * dblSchlick * objectIntersection.vecColor[0] * vecAmbient[0];
			vecColor[1] += dblReflect * dblSchlick * objectIntersection.vecColor[1] * vecAmbient[1];
			vecColor[2] += dblReflect * dblSchlick * objectIntersection.vecColor[2] * vecAmbient[2];

			dblReflect *= 1.0 - dblSchlick;

			if (dblReflect < 0.01) {
				break;
			}

			var dblReflection = dot(vecDirection, objectIntersection.vecNormal);

			vecOrigin[0] = objectIntersection.vecLocation[0];
			vecOrigin[1] = objectIntersection.vecLocation[1];
			vecOrigin[2] = objectIntersection.vecLocation[2];

			vecDirection[0] = vecDirection[0] - (2.0 * dblReflection * objectIntersection.vecNormal[0]);
			vecDirection[1] = vecDirection[1] - (2.0 * dblReflection * objectIntersection.vecNormal[1]);
			vecDirection[2] = vecDirection[2] - (2.0 * dblReflection * objectIntersection.vecNormal[2]);

			dblMin = 0.01;

			dblMax = 10000.0;
		}
	}

	function render(charPixels) {
		for (var intY = 0; intY < intHeight; intY += 1) {
			for (var intX = 0; intX < intWidth; intX += 1) {
				var dblX = (intX / intWidth) - 0.5;
				var dblY = 0.5 - (intY / intHeight);

				var vecColor = [0.0, 0.0, 0.0];
				var vecOrigin = [6.0 * Math.cos(dblTime), 5.0, 6.0 * Math.sin(dblTime)];
				var vecDirection = [0.0 - vecOrigin[0], 1.0 - vecOrigin[1], 0.0 - vecOrigin[2]];

				normalize(vecDirection);

				var vecRight = [0.0, 0.0, 0.0];
				var vecUp = [0.0, 1.0, 0.0];

				cross(vecRight, vecDirection, vecUp);
				cross(vecUp, vecRight, vecDirection);

				vecDirection[0] += (dblX * vecRight[0]) + (dblY * vecUp[0]);
				vecDirection[1] += (dblX * vecRight[1]) + (dblY * vecUp[1]);
				vecDirection[2] += (dblX * vecRight[2]) + (dblY * vecUp[2]);

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