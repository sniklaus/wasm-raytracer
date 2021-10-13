#include <assert.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <cstdlib>
#include <cstring>
#include <ctime>
#include <map>
#include <vector>

#define minimum(intA, intB) (intA < intB) ? (intA) : (intB)
#define maximum(intA, intB) (intA > intB) ? (intA) : (intB)

static inline unsigned long long milliseconds() {
	timespec objTimespec = { };

	clock_gettime(CLOCK_MONOTONIC, &objTimespec);

	return (objTimespec.tv_sec * 1000) + (objTimespec.tv_nsec / 1000000);
}

static inline unsigned long long microseconds() {
	timespec objTimespec = { };

	clock_gettime(CLOCK_MONOTONIC, &objTimespec);

	return (objTimespec.tv_sec * 1000000) + (objTimespec.tv_nsec / 1000);
}

#include "emscripten.h"

// ----------------------------------------------------------

#define Infinity 100000000000.0

struct Plane {
	float vecLocation[3];
	float vecNormal[3];
	float vecColor[3];
	float fltSpecular;
	float fltReflect;
};

struct Sphere {
	float vecLocation[3];
	float fltRadius;
	float vecColor[3];
	float fltSpecular;
	float fltReflect;
};

struct Light {
	float vecLocation[3];
	float vecIntensity[3];
};

struct Intersection {
	float fltDistance;
	float vecLocation[3];
	float vecNormal[3];
	float vecColor[3];
	float fltSpecular;
	float fltReflect;
};

int intWidth = 0;
int intHeight = 0;

int objPlanes_length = 0;
Plane objPlanes[16] = {};

int objSpheres_length = 0;
Sphere objSpheres[16] = {};

int objLights_length = 0;
Light objLights[16] = {};

float vecAmbient[3] = { 0.0, 0.0, 0.0 };

float fltTime = 0.0;

static inline float dot(float vecA[3], float vecB[3]) {
	return (vecA[0] * vecB[0]) + (vecA[1] * vecB[1]) + (vecA[2] * vecB[2]);
}

static inline float length(float vecA[3]) {
	return sqrt(dot(vecA, vecA));
}

static inline void normalize(float vecA[3]) {
	float fltLength = fmax(0.00001, length(vecA));

	vecA[0] /= fltLength;
	vecA[1] /= fltLength;
	vecA[2] /= fltLength;
}

static inline void cross(float vecA[3], float vecB[3], float vecC[3]) {
	vecA[0] = (vecB[1] * vecC[2]) - (vecB[2] * vecC[1]);
	vecA[1] = (vecB[2] * vecC[0]) - (vecB[0] * vecC[2]);
	vecA[2] = (vecB[0] * vecC[1]) - (vecB[1] * vecC[0]);
}

static inline float intersection(Intersection* objIntersection, float* vecOrigin, float* vecDirection, float fltMin, float fltMax, bool boolPeek) {
	float fltIntersection = Infinity;

	normalize(vecDirection);

	for (int intPlane = 0; intPlane < objPlanes_length; intPlane += 1) {
		float vecDifference[3] = { 0.0, 0.0, 0.0 };

		vecDifference[0] = objPlanes[intPlane].vecLocation[0] - vecOrigin[0];
		vecDifference[1] = objPlanes[intPlane].vecLocation[1] - vecOrigin[1];
		vecDifference[2] = objPlanes[intPlane].vecLocation[2] - vecOrigin[2];

		float fltDenominator = dot(vecDirection, objPlanes[intPlane].vecNormal);

		if (fabs(fltDenominator) < 0.01) {
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

		objIntersection->fltDistance = fltDistance;

		objIntersection->vecLocation[0] = vecOrigin[0] + (fltDistance * vecDirection[0]);
		objIntersection->vecLocation[1] = vecOrigin[1] + (fltDistance * vecDirection[1]);
		objIntersection->vecLocation[2] = vecOrigin[2] + (fltDistance * vecDirection[2]);

		objIntersection->vecNormal[0] = objPlanes[intPlane].vecNormal[0];
		objIntersection->vecNormal[1] = objPlanes[intPlane].vecNormal[1];
		objIntersection->vecNormal[2] = objPlanes[intPlane].vecNormal[2];

		objIntersection->vecColor[0] = objPlanes[intPlane].vecColor[0];
		objIntersection->vecColor[1] = objPlanes[intPlane].vecColor[1];
		objIntersection->vecColor[2] = objPlanes[intPlane].vecColor[2];

		objIntersection->fltSpecular = objPlanes[intPlane].fltSpecular;

		objIntersection->fltReflect = objPlanes[intPlane].fltReflect;

		float fltCheckerboard = fmod(fabs(floor(objIntersection->vecLocation[0]) + floor(objIntersection->vecLocation[2])), 2.0);

		objIntersection->vecColor[0] *= 0.5 + (0.5 * fltCheckerboard);
		objIntersection->vecColor[1] *= 0.5 + (0.5 * fltCheckerboard);
		objIntersection->vecColor[2] *= 0.5 + (0.5 * fltCheckerboard);
	}

	for (int intSphere = 0; intSphere < objSpheres_length; intSphere += 1) {
		float vecDifference[3] = { 0.0, 0.0, 0.0 };

		vecDifference[0] = vecOrigin[0] - objSpheres[intSphere].vecLocation[0];
		vecDifference[1] = vecOrigin[1] - objSpheres[intSphere].vecLocation[1];
		vecDifference[2] = vecOrigin[2] - objSpheres[intSphere].vecLocation[2];

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
				fltDistance = fmin(fltDistance, fltFirst);
			}
		}

		if (fltSecond > fltMin) {
			if (fltSecond < fltMax) {
				fltDistance = fmin(fltDistance, fltSecond);
			}
		}

		if (fltIntersection < fltDistance) {
			continue;
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

		objIntersection->fltDistance = fltDistance;

		objIntersection->vecLocation[0] = vecOrigin[0] + (fltDistance * vecDirection[0]);
		objIntersection->vecLocation[1] = vecOrigin[1] + (fltDistance * vecDirection[1]);
		objIntersection->vecLocation[2] = vecOrigin[2] + (fltDistance * vecDirection[2]);

		objIntersection->vecNormal[0] = objIntersection->vecLocation[0] - objSpheres[intSphere].vecLocation[0];
		objIntersection->vecNormal[1] = objIntersection->vecLocation[1] - objSpheres[intSphere].vecLocation[1];
		objIntersection->vecNormal[2] = objIntersection->vecLocation[2] - objSpheres[intSphere].vecLocation[2];

		objIntersection->vecColor[0] = objSpheres[intSphere].vecColor[0];
		objIntersection->vecColor[1] = objSpheres[intSphere].vecColor[1];
		objIntersection->vecColor[2] = objSpheres[intSphere].vecColor[2];

		objIntersection->fltSpecular = objSpheres[intSphere].fltSpecular;

		objIntersection->fltReflect = objSpheres[intSphere].fltReflect;
	}

	if (boolPeek != true) {
		if (fltIntersection < fltMax) {
			normalize(objIntersection->vecNormal);
		}
	}

	return fltIntersection;
}

void raytrace(float* vecColor, float* vecOrigin, float* vecDirection, float fltMin, float fltMax) {
	vecColor[0] = 0.0;
	vecColor[1] = 0.0;
	vecColor[2] = 0.0;

	float fltReflect = 1.0;

	for (int intRecurse = 0; intRecurse < 8; intRecurse += 1) {
		Intersection objIntersection = {};

		if (intersection(&objIntersection, vecOrigin, vecDirection, fltMin, fltMax, false) > 10000.0) {
			return;
		}

		float fltAngle = fabs(dot(vecDirection, objIntersection.vecNormal));

		float fltSchlick = (1.0 - objIntersection.fltReflect) + (objIntersection.fltReflect * pow(1.0 - fltAngle, 5.0));

		for (int intLight = 0; intLight < objLights_length; intLight += 1) {
			float vecLight[3] = { 0.0, 0.0, 0.0 };

			vecLight[0] = objLights[intLight].vecLocation[0] - objIntersection.vecLocation[0];
			vecLight[1] = objLights[intLight].vecLocation[1] - objIntersection.vecLocation[1];
			vecLight[2] = objLights[intLight].vecLocation[2] - objIntersection.vecLocation[2];

			if (intersection(&objIntersection, objIntersection.vecLocation, vecLight, 0.01, 10000.0, true) < 10000.0) {
				continue;
			}

			float fltDiffuse = dot(vecLight, objIntersection.vecNormal);

			float vecSpecular[3] = { 0.0, 0.0, 0.0 };

			vecSpecular[0] = vecLight[0] - (2.0 * fltDiffuse * objIntersection.vecNormal[0]);
			vecSpecular[1] = vecLight[1] - (2.0 * fltDiffuse * objIntersection.vecNormal[1]);
			vecSpecular[2] = vecLight[2] - (2.0 * fltDiffuse * objIntersection.vecNormal[2]);

			float fltSpecular = fmax(0.01, pow(dot(vecDirection, vecSpecular), objIntersection.fltSpecular));

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

		float fltReflection = dot(vecDirection, objIntersection.vecNormal);

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

extern "C" void EMSCRIPTEN_KEEPALIVE render(unsigned char* charPixels) {
	for (int intY = 0; intY < intHeight; intY += 1) {
		for (int intX = 0; intX < intWidth; intX += 1) {
			float fltX = (1.0 * intX / intWidth) - 0.5;
			float fltY = 0.5 - (1.0 * intY / intHeight);

			float vecColor[3] = { 0.0f, 0.0f, 0.0f };
			float vecOrigin[3] = { 6.0f * cos(fltTime), 5.0f, 6.0f * sin(fltTime) };
			float vecDirection[3] = { 0.0f - vecOrigin[0], 1.0f - vecOrigin[1], 0.0f - vecOrigin[2] };

			normalize(vecDirection);

			float vecRight[3] = { 0.0, 0.0, 0.0 };
			float vecUp[3] = { 0.0, 1.0, 0.0 };

			cross(vecRight, vecDirection, vecUp);
			cross(vecUp, vecRight, vecDirection);

			vecDirection[0] += (fltX * vecRight[0]) + (fltY * vecUp[0]);
			vecDirection[1] += (fltX * vecRight[1]) + (fltY * vecUp[1]);
			vecDirection[2] += (fltX * vecRight[2]) + (fltY * vecUp[2]);

			raytrace(vecColor, vecOrigin, vecDirection, 1.0, 10000.0);

			charPixels[(intY * intWidth * 4) + (intX * 4) + 0] = fmin(255.0, 255.0 * vecColor[0]);
			charPixels[(intY * intWidth * 4) + (intX * 4) + 1] = fmin(255.0, 255.0 * vecColor[1]);
			charPixels[(intY * intWidth * 4) + (intX * 4) + 2] = fmin(255.0, 255.0 * vecColor[2]);
			charPixels[(intY * intWidth * 4) + (intX * 4) + 3] = 255;
		}
	}
}

// ----------------------------------------------------------

extern "C" void EMSCRIPTEN_KEEPALIVE uniform1i(char* charVariable, int intIndex, int intValue) {
	if (strcmp(charVariable, "intWidth") == 0) {
		intWidth = intValue;

	} else if (strcmp(charVariable, "intHeight") == 0) {
		intHeight = intValue;

	} else if (strcmp(charVariable, "objPlanes_length") == 0) {
		objPlanes_length = intValue;

	} else if (strcmp(charVariable, "objSpheres_length") == 0) {
		objSpheres_length = intValue;

	} else if (strcmp(charVariable, "objLights_length") == 0) {
		objLights_length = intValue;
		
	}
}

extern "C" void EMSCRIPTEN_KEEPALIVE uniform1f(char* charVariable, int intIndex, float fltValue) {
	if (strcmp(charVariable, "objPlanes[].fltSpecular") == 0) {
		objPlanes[intIndex].fltSpecular = fltValue;

	} else if (strcmp(charVariable, "objPlanes[].fltReflect") == 0) {
		objPlanes[intIndex].fltReflect = fltValue;

	} else if (strcmp(charVariable, "objSpheres[].fltRadius") == 0) {
		objSpheres[intIndex].fltRadius = fltValue;

	} else if (strcmp(charVariable, "objSpheres[].fltSpecular") == 0) {
		objSpheres[intIndex].fltSpecular = fltValue;

	} else if (strcmp(charVariable, "objSpheres[].fltReflect") == 0) {
		objSpheres[intIndex].fltReflect = fltValue;

	} else if (strcmp(charVariable, "fltTime") == 0) {
		fltTime = fltValue;
		
	}
}

extern "C" void EMSCRIPTEN_KEEPALIVE uniform3fv(char* charVariable, int intIndex, float fltValue_0, float fltValue_1, float fltValue_2) {
	if (strcmp(charVariable, "objPlanes[].vecLocation") == 0) {
		objPlanes[intIndex].vecLocation[0] = fltValue_0;
		objPlanes[intIndex].vecLocation[1] = fltValue_1;
		objPlanes[intIndex].vecLocation[2] = fltValue_2;

	} else if (strcmp(charVariable, "objPlanes[].vecNormal") == 0) {
		objPlanes[intIndex].vecNormal[0] = fltValue_0;
		objPlanes[intIndex].vecNormal[1] = fltValue_1;
		objPlanes[intIndex].vecNormal[2] = fltValue_2;

	} else if (strcmp(charVariable, "objPlanes[].vecColor") == 0) {
		objPlanes[intIndex].vecColor[0] = fltValue_0;
		objPlanes[intIndex].vecColor[1] = fltValue_1;
		objPlanes[intIndex].vecColor[2] = fltValue_2;

	} else if (strcmp(charVariable, "objSpheres[].vecLocation") == 0) {
		objSpheres[intIndex].vecLocation[0] = fltValue_0;
		objSpheres[intIndex].vecLocation[1] = fltValue_1;
		objSpheres[intIndex].vecLocation[2] = fltValue_2;

	} else if (strcmp(charVariable, "objSpheres[].vecColor") == 0) {
		objSpheres[intIndex].vecColor[0] = fltValue_0;
		objSpheres[intIndex].vecColor[1] = fltValue_1;
		objSpheres[intIndex].vecColor[2] = fltValue_2;

	} else if (strcmp(charVariable, "objLights[].vecLocation") == 0) {
		objLights[intIndex].vecLocation[0] = fltValue_0;
		objLights[intIndex].vecLocation[1] = fltValue_1;
		objLights[intIndex].vecLocation[2] = fltValue_2;

	} else if (strcmp(charVariable, "objLights[].vecIntensity") == 0) {
		objLights[intIndex].vecIntensity[0] = fltValue_0;
		objLights[intIndex].vecIntensity[1] = fltValue_1;
		objLights[intIndex].vecIntensity[2] = fltValue_2;

	} else if (strcmp(charVariable, "vecAmbient") == 0) {
		vecAmbient[0] = fltValue_0;
		vecAmbient[1] = fltValue_1;
		vecAmbient[2] = fltValue_2;

	}
}
