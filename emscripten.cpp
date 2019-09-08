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
	timespec objectTimespec = { };

	clock_gettime(CLOCK_MONOTONIC, &objectTimespec);

	return (objectTimespec.tv_sec * 1000) + (objectTimespec.tv_nsec / 1000000);
}

static inline unsigned long long microseconds() {
	timespec objectTimespec = { };

	clock_gettime(CLOCK_MONOTONIC, &objectTimespec);

	return (objectTimespec.tv_sec * 1000000) + (objectTimespec.tv_nsec / 1000);
}

#include "emscripten.h"

// ----------------------------------------------------------

#define Infinity 100000000000.0

struct Plane {
	double vecLocation[3];
	double vecNormal[3];
	double vecColor[3];
	double dblSpecular;
	double dblReflect;
};

struct Sphere {
	double vecLocation[3];
	double dblRadius;
	double vecColor[3];
	double dblSpecular;
	double dblReflect;
};

struct Light {
	double vecLocation[3];
	double vecIntensity[3];
};

struct Intersection {
	double dblDistance;
	double vecLocation[3];
	double vecNormal[3];
	double vecColor[3];
	double dblSpecular;
	double dblReflect;
};

int intWidth = 0;
int intHeight = 0;

int objectPlanes_length = 0;
Plane objectPlanes[16] = {};

int objectSpheres_length = 0;
Sphere objectSpheres[16] = {};

int objectLights_length = 0;
Light objectLights[16] = {};

double vecAmbient[3] = { 0.0, 0.0, 0.0 };

double dblTime = 0.0;

static inline double dot(double vecA[3], double vecB[3]) {
	return (vecA[0] * vecB[0]) + (vecA[1] * vecB[1]) + (vecA[2] * vecB[2]);
}

static inline double length(double vecA[3]) {
	return sqrt(dot(vecA, vecA));
}

static inline void normalize(double vecA[3]) {
	double dblLength = fmax(0.00001, length(vecA));

	vecA[0] /= dblLength;
	vecA[1] /= dblLength;
	vecA[2] /= dblLength;
}

static inline void cross(double vecA[3], double vecB[3], double vecC[3]) {
	vecA[0] = (vecB[1] * vecC[2]) - (vecB[2] * vecC[1]);
	vecA[1] = (vecB[2] * vecC[0]) - (vecB[0] * vecC[2]);
	vecA[2] = (vecB[0] * vecC[1]) - (vecB[1] * vecC[0]);
}

static inline double intersection(Intersection* objectIntersection, double* vecOrigin, double* vecDirection, double dblMin, double dblMax) {
	double dblIntersection = Infinity;

	normalize(vecDirection);

	for (int intPlane = 0; intPlane < objectPlanes_length; intPlane += 1) {
		double vecDifference[3] = { 0.0, 0.0, 0.0 };

		vecDifference[0] = objectPlanes[intPlane].vecLocation[0] - vecOrigin[0];
		vecDifference[1] = objectPlanes[intPlane].vecLocation[1] - vecOrigin[1];
		vecDifference[2] = objectPlanes[intPlane].vecLocation[2] - vecOrigin[2];

		double dblDenominator = dot(vecDirection, objectPlanes[intPlane].vecNormal);

		if (fabs(dblDenominator) < 0.01) {
			continue;
		}

		double dblDistance = dot(vecDifference, objectPlanes[intPlane].vecNormal) / dblDenominator;

		if (dblDistance < dblMin) {
			continue;

		} else if (dblDistance > dblMax) {
			continue;

		} else if (dblDistance > dblIntersection) {
			continue;

		}

		if (dblIntersection == Infinity) {
			if (objectIntersection->dblDistance != 0.0) {
				return dblDistance;
			}
		}

		dblIntersection = dblDistance;

		objectIntersection->dblDistance = dblDistance;

		objectIntersection->vecLocation[0] = vecOrigin[0] + (dblDistance * vecDirection[0]);
		objectIntersection->vecLocation[1] = vecOrigin[1] + (dblDistance * vecDirection[1]);
		objectIntersection->vecLocation[2] = vecOrigin[2] + (dblDistance * vecDirection[2]);

		objectIntersection->vecNormal[0] = objectPlanes[intPlane].vecNormal[0];
		objectIntersection->vecNormal[1] = objectPlanes[intPlane].vecNormal[1];
		objectIntersection->vecNormal[2] = objectPlanes[intPlane].vecNormal[2];

		objectIntersection->vecColor[0] = objectPlanes[intPlane].vecColor[0];
		objectIntersection->vecColor[1] = objectPlanes[intPlane].vecColor[1];
		objectIntersection->vecColor[2] = objectPlanes[intPlane].vecColor[2];

		objectIntersection->dblSpecular = objectPlanes[intPlane].dblSpecular;

		objectIntersection->dblReflect = objectPlanes[intPlane].dblReflect;

		double dblCheckerboard = fmod(fabs(floor(objectIntersection->vecLocation[0]) + floor(objectIntersection->vecLocation[2])), 2.0);

		objectIntersection->vecColor[0] *= 0.5 + (0.5 * dblCheckerboard);
		objectIntersection->vecColor[1] *= 0.5 + (0.5 * dblCheckerboard);
		objectIntersection->vecColor[2] *= 0.5 + (0.5 * dblCheckerboard);
	}

	for (int intSphere = 0; intSphere < objectSpheres_length; intSphere += 1) {
		double vecDifference[3] = { 0.0, 0.0, 0.0 };

		vecDifference[0] = vecOrigin[0] - objectSpheres[intSphere].vecLocation[0];
		vecDifference[1] = vecOrigin[1] - objectSpheres[intSphere].vecLocation[1];
		vecDifference[2] = vecOrigin[2] - objectSpheres[intSphere].vecLocation[2];

		double dblAlpha = dot(vecDirection, vecDifference);
		double dblDiscriminant = (dblAlpha * dblAlpha) - dot(vecDifference, vecDifference) + (objectSpheres[intSphere].dblRadius * objectSpheres[intSphere].dblRadius);

		if (dblDiscriminant < 0.01) {
			continue;
		}

		double dblFirst = (-1.0 * dblAlpha) - sqrt(dblDiscriminant);
		double dblSecond = (-1.0 * dblAlpha) + sqrt(dblDiscriminant);
		double dblDistance = Infinity;

		if (dblFirst > dblMin) {
			if (dblFirst < dblMax) {
				dblDistance = fmin(dblDistance, dblFirst);
			}
		}

		if (dblSecond > dblMin) {
			if (dblSecond < dblMax) {
				dblDistance = fmin(dblDistance, dblSecond);
			}
		}

		if (dblIntersection < dblDistance) {
			continue;
		}

		if (dblDistance == Infinity) {
			continue;

		} else if (dblDistance > dblIntersection) {
			continue;

		}

		if (dblIntersection == Infinity) {
			if (objectIntersection->dblDistance != 0.0) {
				return dblDistance;
			}
		}

		dblIntersection = dblDistance;

		objectIntersection->dblDistance = dblDistance;

		objectIntersection->vecLocation[0] = vecOrigin[0] + (dblDistance * vecDirection[0]);
		objectIntersection->vecLocation[1] = vecOrigin[1] + (dblDistance * vecDirection[1]);
		objectIntersection->vecLocation[2] = vecOrigin[2] + (dblDistance * vecDirection[2]);

		objectIntersection->vecNormal[0] = objectIntersection->vecLocation[0] - objectSpheres[intSphere].vecLocation[0];
		objectIntersection->vecNormal[1] = objectIntersection->vecLocation[1] - objectSpheres[intSphere].vecLocation[1];
		objectIntersection->vecNormal[2] = objectIntersection->vecLocation[2] - objectSpheres[intSphere].vecLocation[2];

		objectIntersection->vecColor[0] = objectSpheres[intSphere].vecColor[0];
		objectIntersection->vecColor[1] = objectSpheres[intSphere].vecColor[1];
		objectIntersection->vecColor[2] = objectSpheres[intSphere].vecColor[2];

		objectIntersection->dblSpecular = objectSpheres[intSphere].dblSpecular;

		objectIntersection->dblReflect = objectSpheres[intSphere].dblReflect;
	}

	if (dblIntersection < dblMax) {
		normalize(objectIntersection->vecNormal);
	}

	return dblIntersection;
}

void raytrace(double* vecColor, double* vecOrigin, double* vecDirection, double dblMin, double dblMax) {
	vecColor[0] = 0.0;
	vecColor[1] = 0.0;
	vecColor[2] = 0.0;

	double dblReflect = 1.0;

	for (int intRecurse = 0; intRecurse < 8; intRecurse += 1) {
		Intersection objectIntersection = {};

		if (intersection(&objectIntersection, vecOrigin, vecDirection, dblMin, dblMax) > 10000.0) {
			return;
		}

		double dblAngle = fabs(dot(vecDirection, objectIntersection.vecNormal));

		double dblSchlick = (1.0 - objectIntersection.dblReflect) + (objectIntersection.dblReflect * pow(1.0 - dblAngle, 5.0));

		for (int intLight = 0; intLight < objectLights_length; intLight += 1) {
			double vecLight[3] = { 0.0, 0.0, 0.0 };

			vecLight[0] = objectLights[intLight].vecLocation[0] - objectIntersection.vecLocation[0];
			vecLight[1] = objectLights[intLight].vecLocation[1] - objectIntersection.vecLocation[1];
			vecLight[2] = objectLights[intLight].vecLocation[2] - objectIntersection.vecLocation[2];

			if (intersection(&objectIntersection, objectIntersection.vecLocation, vecLight, 0.01, 10000.0) < 10000.0) {
				continue;
			}

			double dblDiffuse = dot(vecLight, objectIntersection.vecNormal);

			double vecSpecular[3] = { 0.0, 0.0, 0.0 };

			vecSpecular[0] = vecLight[0] - (2.0 * dblDiffuse * objectIntersection.vecNormal[0]);
			vecSpecular[1] = vecLight[1] - (2.0 * dblDiffuse * objectIntersection.vecNormal[1]);
			vecSpecular[2] = vecLight[2] - (2.0 * dblDiffuse * objectIntersection.vecNormal[2]);

			double dblSpecular = fmax(0.01, pow(dot(vecDirection, vecSpecular), objectIntersection.dblSpecular));

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

		double dblReflection = dot(vecDirection, objectIntersection.vecNormal);

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

extern "C" void render(unsigned char* charPixels) {
	for (int intY = 0; intY < intHeight; intY += 1) {
		for (int intX = 0; intX < intWidth; intX += 1) {
			double dblX = (1.0 * intX / intWidth) - 0.5;
			double dblY = 0.5 - (1.0 * intY / intHeight);

			double vecColor[3] = { 0.0, 0.0, 0.0 };
			double vecOrigin[3] = {6.0 * cos(dblTime), 5.0, 6.0 * sin(dblTime)};
			double vecDirection[3] = {0.0 - vecOrigin[0], 1.0 - vecOrigin[1], 0.0 - vecOrigin[2]};

			normalize(vecDirection);

			double vecRight[3] = { 0.0, 0.0, 0.0 };
			double vecUp[3] = {0.0, 1.0, 0.0};

			cross(vecRight, vecDirection, vecUp);
			cross(vecUp, vecRight, vecDirection);

			vecDirection[0] += (dblX * vecRight[0]) + (dblY * vecUp[0]);
			vecDirection[1] += (dblX * vecRight[1]) + (dblY * vecUp[1]);
			vecDirection[2] += (dblX * vecRight[2]) + (dblY * vecUp[2]);

			raytrace(vecColor, vecOrigin, vecDirection, 1.0, 10000.0);

			charPixels[(intY * intWidth * 4) + (intX * 4) + 0] = fmin(255.0, 255.0 * vecColor[0]);
			charPixels[(intY * intWidth * 4) + (intX * 4) + 1] = fmin(255.0, 255.0 * vecColor[1]);
			charPixels[(intY * intWidth * 4) + (intX * 4) + 2] = fmin(255.0, 255.0 * vecColor[2]);
			charPixels[(intY * intWidth * 4) + (intX * 4) + 3] = 255;
		}
	}
}

// ----------------------------------------------------------

extern "C" void uniform1i(char* charVariable, int intIndex, int intValue) {
	if (strcmp(charVariable, "intWidth") == 0) {
		intWidth = intValue;

	} else if (strcmp(charVariable, "intHeight") == 0) {
		intHeight = intValue;

	} else if (strcmp(charVariable, "objectPlanes_length") == 0) {
		objectPlanes_length = intValue;

	} else if (strcmp(charVariable, "objectSpheres_length") == 0) {
		objectSpheres_length = intValue;

	} else if (strcmp(charVariable, "objectLights_length") == 0) {
		objectLights_length = intValue;
		
	}
}

extern "C" void uniform1f(char* charVariable, int intIndex, double dblValue) {
	if (strcmp(charVariable, "objectPlanes[].dblSpecular") == 0) {
		objectPlanes[intIndex].dblSpecular = dblValue;

	} else if (strcmp(charVariable, "objectPlanes[].dblReflect") == 0) {
		objectPlanes[intIndex].dblReflect = dblValue;

	} else if (strcmp(charVariable, "objectSpheres[].dblRadius") == 0) {
		objectSpheres[intIndex].dblRadius = dblValue;

	} else if (strcmp(charVariable, "objectSpheres[].dblSpecular") == 0) {
		objectSpheres[intIndex].dblSpecular = dblValue;

	} else if (strcmp(charVariable, "objectSpheres[].dblReflect") == 0) {
		objectSpheres[intIndex].dblReflect = dblValue;

	} else if (strcmp(charVariable, "dblTime") == 0) {
		dblTime = dblValue;
		
	}
}

extern "C" void uniform3fv(char* charVariable, int intIndex, double dblValue_0, double dblValue_1, double dblValue_2) {
	if (strcmp(charVariable, "objectPlanes[].vecLocation") == 0) {
		objectPlanes[intIndex].vecLocation[0] = dblValue_0;
		objectPlanes[intIndex].vecLocation[1] = dblValue_1;
		objectPlanes[intIndex].vecLocation[2] = dblValue_2;

	} else if (strcmp(charVariable, "objectPlanes[].vecNormal") == 0) {
		objectPlanes[intIndex].vecNormal[0] = dblValue_0;
		objectPlanes[intIndex].vecNormal[1] = dblValue_1;
		objectPlanes[intIndex].vecNormal[2] = dblValue_2;

	} else if (strcmp(charVariable, "objectPlanes[].vecColor") == 0) {
		objectPlanes[intIndex].vecColor[0] = dblValue_0;
		objectPlanes[intIndex].vecColor[1] = dblValue_1;
		objectPlanes[intIndex].vecColor[2] = dblValue_2;

	} else if (strcmp(charVariable, "objectSpheres[].vecLocation") == 0) {
		objectSpheres[intIndex].vecLocation[0] = dblValue_0;
		objectSpheres[intIndex].vecLocation[1] = dblValue_1;
		objectSpheres[intIndex].vecLocation[2] = dblValue_2;

	} else if (strcmp(charVariable, "objectSpheres[].vecColor") == 0) {
		objectSpheres[intIndex].vecColor[0] = dblValue_0;
		objectSpheres[intIndex].vecColor[1] = dblValue_1;
		objectSpheres[intIndex].vecColor[2] = dblValue_2;

	} else if (strcmp(charVariable, "objectLights[].vecLocation") == 0) {
		objectLights[intIndex].vecLocation[0] = dblValue_0;
		objectLights[intIndex].vecLocation[1] = dblValue_1;
		objectLights[intIndex].vecLocation[2] = dblValue_2;

	} else if (strcmp(charVariable, "objectLights[].vecIntensity") == 0) {
		objectLights[intIndex].vecIntensity[0] = dblValue_0;
		objectLights[intIndex].vecIntensity[1] = dblValue_1;
		objectLights[intIndex].vecIntensity[2] = dblValue_2;

	} else if (strcmp(charVariable, "vecAmbient") == 0) {
		vecAmbient[0] = dblValue_0;
		vecAmbient[1] = dblValue_1;
		vecAmbient[2] = dblValue_2;

	}
}

// ----------------------------------------------------------

#include <SDL/SDL.h>

SDL_Surface* objectSurface = NULL;

void loop() {
	unsigned long long intBefore = milliseconds();

	dblTime += 0.003;

	if (SDL_MUSTLOCK(objectSurface) == true) {
		SDL_LockSurface(objectSurface);
	}

	render((unsigned char*) (objectSurface->pixels));

	if (SDL_MUSTLOCK(objectSurface) == true) {
		SDL_UnlockSurface(objectSurface);
	}

	unsigned long long intAfter = milliseconds();

	printf("%llu\n", intAfter - intBefore);
};

extern "C" int main(int argc, char** argv) {
	intWidth = 500;
	intHeight = 500;

	objectPlanes_length = 1;
	objectPlanes[0] = (Plane) {
		{ 0.0, 0.0, 0.0 },
		{ 0.0, 1.0, 0.0 },
		{ 0.7, 0.7, 0.7 },
		10.0,
		0.1
	};

	objectSpheres_length = 5;
	objectSpheres[0] = (Sphere) {
		{ 0.0, 2.0, 0.0 },
		1.0,
		{ 1.0, 1.0, 1.0 },
		20.0,
		0.7
	};
	objectSpheres[1] = (Sphere) {
		{ 0.0, 1.0, 3.0 },
		0.7,
		{ 121.0 / 255.0, 85.0 / 255.0, 72.0 / 255.0 },
		10.0,
		0.0
	};
	objectSpheres[2] = (Sphere) {
		{ 0.0, 1.0, -3.0 },
		0.7,
		{ 76.0 / 255.0, 175.0 / 255.0, 80.0 / 255.0 },
		10.0,
		0.0
	};
	objectSpheres[3] = (Sphere) {
		{ 3.0, 1.0, 0.0 },
		0.7,
		{ 41.0 / 255.0, 182.0 / 255.0, 246.0 / 255.0 },
		10.0,
		0.0
	};
	objectSpheres[4] = (Sphere) {
		{ -3.0, 1.0, 0.0 },
		0.7,
		{ 255.0 / 255.0, 167.0 / 255.0, 38.0 / 255.0 },
		10.0,
		0.0
	};

	objectLights_length = 1;
	objectLights[0] = (Light) {
		{ 0.0, 10.0, 5.0 },
		{ 0.8, 0.8, 0.8 }
	};

	vecAmbient[0] = 0.2;
	vecAmbient[1] = 0.2;
	vecAmbient[2] = 0.2;

	dblTime = 0.3;

	SDL_Init(SDL_INIT_VIDEO);

	objectSurface = SDL_SetVideoMode(intWidth, intHeight, 32, SDL_SWSURFACE);

	emscripten_set_main_loop(loop, 60, 1);

	SDL_Quit();

	return 0;
}