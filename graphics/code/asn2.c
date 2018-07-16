/**
 * CS3388 Assignment 2
 * Alex Gyori
 * October 17th, 2017
 *
 * Draws a wireframe of a sphere and a torus with basic transformations.
 */

#include <stdio.h>
#include <math.h>
#include "bresenham.h"
#include "camera.h"

#define SPHERE_LONGITUDES 16
#define SPHERE_LATITUDES 16
#define TORUS_LONGITUDES 16
#define TORUS_TUBE_FACES 16

/**
 * line_t
 * Alex Gyori
 * October 17th, 2017
 * Struct that represents a line with a starting and ending coordinate.
 * dmatrix_t start - the starting point
 * dmatrix_t end - the ending point
 */
typedef struct line {
    dmatrix_t start;
    dmatrix_t end;
} line_t;

/**
 * lineList_t
 * Alex Gyori
 * October 17th, 2017
 * Struct that holds a list of lines.
 * line_t l - the line
 * lineList *next - pointer to the next line
 */
typedef struct lineList {
    line_t l;
    struct lineList *next;
} lineList_t;

/**
 * wireframe_t
 * Alex Gyori
 * October 17th, 2017
 * Struct to hold a wireframe of an object
 * lineList_t *lines - the list of lines in the wireframe
 */
typedef struct wireframe {
    lineList_t *lines;
} wireframe_t;

/**
 * line_alloc
 * Alex Gyori
 * October 17th, 2017
 * Allocates memory for the start and end points of a line
 * line_t *l - the line
 */
void line_alloc(line_t *l) {
    dmat_alloc(&l->start, 4, 1);
    dmat_alloc(&l->end, 4, 1);
}

/**
 * create_camera
 * Alex Gyori, supplied from assignment
 * October 17th, 2017
 * Generates a camera.
 * returns the camera matrix
 */
dmatrix_t *create_camera() {
    dmatrix_t E ; /* The centre of projection for the camera */
    
    dmat_alloc(&E,4,1) ;
    
    E.m[1][1] = Ex ;
    E.m[2][1] = Ey ;
    E.m[3][1] = Ez ;
    E.m[4][1] = 1.0 ;
    
    dmatrix_t G ; /* Point gazed at by camera */
    
    dmat_alloc(&G,4,1) ;
    
    G.m[1][1] = Gx ;
    G.m[2][1] = Gy ;
    G.m[3][1] = Gz ;
    G.m[4][1] = 1.0 ;

    return build_camera_matrix(&E,&G) ;
}

/**
 * getScalingMatrix
 * Alex Gyori
 * October 17th, 2017
 * Generates the matrix for scale transformations given 3 values
 * dmatrix_t *M - the matrix that will hold the scale matrix
 * double x - scale of x value
 * double y - scale of y value
 * double z - scale of z value
 */
void getScalingMatrix(dmatrix_t *M, double x, double y, double z) {
    dmat_alloc(M, 4, 4);
    
    (*M).m[1][1] = x;
    (*M).m[2][1] = 0.0;
    (*M).m[3][1] = 0.0;
    (*M).m[4][1] = 0.0;
    
    (*M).m[1][2] = 0.0;
    (*M).m[2][2] = y;
    (*M).m[3][2] = 0.0;
    (*M).m[4][2] = 0.0;
    
    (*M).m[1][3] = 0.0;
    (*M).m[2][3] = 0.0;
    (*M).m[3][3] = z;
    (*M).m[4][3] = 0.0;
    
    (*M).m[1][4] = 0.0;
    (*M).m[2][4] = 0.0;
    (*M).m[3][4] = 0.0;
    (*M).m[4][4] = 1.0;
}

/**
 * getRotateX
 * Alex Gyori
 * October 17th, 2017
 * Generates the matrix for rotating about the X axis
 * dmatrix_t *M - the matrix to hold the transformation matrix
 * double angle - the angle to rotate
 */
void getRotateX(dmatrix_t *M, double angle) {
    (*M).m[1][1] = 1.0;
    (*M).m[2][1] = 0.0;
    (*M).m[3][1] = 0.0;
    (*M).m[4][1] = 0.0;
    
    (*M).m[1][2] = 0.0;
    (*M).m[2][2] = cos(angle);
    (*M).m[3][2] = sin(angle);
    (*M).m[4][2] = 0.0;
    
    (*M).m[1][3] = 0.0;
    (*M).m[2][3] = -sin(angle);
    (*M).m[3][3] = cos(angle);
    (*M).m[4][3] = 0.0;
    
    (*M).m[1][4] = 0.0;
    (*M).m[2][4] = 0.0;
    (*M).m[3][4] = 0.0;
    (*M).m[4][4] = 1.0;
}

/**
 * getRotateY
 * Alex Gyori
 * October 17th, 2017
 * Generates the matrix for rotating about the Y axis
 * dmatrix_t *M - the matrix to hold the transformation matrix
 * double angle - the angle to rotate
 */
void getRotateY(dmatrix_t *M, double angle) { 
    (*M).m[1][1] = cos(angle);
    (*M).m[2][1] = 0.0;
    (*M).m[3][1] = -sin(angle);
    (*M).m[4][1] = 0.0;
    
    (*M).m[1][2] = 0.0;
    (*M).m[2][2] = 1.0;
    (*M).m[3][2] = 0.0;
    (*M).m[4][2] = 0.0;
    
    (*M).m[1][3] = sin(angle);
    (*M).m[2][3] = 0.0;
    (*M).m[3][3] = cos(angle);
    (*M).m[4][3] = 0.0;
    
    (*M).m[1][4] = 0.0;
    (*M).m[2][4] = 0.0;
    (*M).m[3][4] = 0.0;
    (*M).m[4][4] = 1.0;
}

/**
 * getRotateZ
 * Alex Gyori
 * October 17th, 2017
 * Generates the matrix for rotating about the Z axis
 * dmatrix_t *M - the matrix to hold the transformation matrix
 * double angle - the angle to rotate
 */
void getRotateZ(dmatrix_t *M, double angle) {
    (*M).m[1][1] = cos(angle);
    (*M).m[2][1] = sin(angle);
    (*M).m[3][1] = 0.0;
    (*M).m[4][1] = 0.0;
    
    (*M).m[1][2] = -sin(angle);
    (*M).m[2][2] = cos(angle);
    (*M).m[3][2] = 0.0;
    (*M).m[4][2] = 0.0;
    
    (*M).m[1][3] = 0.0;
    (*M).m[2][3] = 0.0;
    (*M).m[3][3] = 1.0;
    (*M).m[4][3] = 0.0;
    
    (*M).m[1][4] = 0.0;
    (*M).m[2][4] = 0.0;
    (*M).m[3][4] = 0.0;
    (*M).m[4][4] = 1.0;
}

/**
 * getTranslateMatrix
 * Alex Gyori
 * October 17th, 2017
 * Generates a translation matrix given coordinates.
 * dmatrix_t *translate - matrix to store the translate matrix in
 * double x - x value of translation
 * double y - y value of translation
 * double z - z value of translation
 */
void *getTranslateMatrix(dmatrix_t *translate, double x, double y, double z) {
    translate->m[1][1] = 1.0;
    translate->m[2][1] = 0.0;
    translate->m[3][1] = 0.0;
    translate->m[4][1] = 0.0;
    
    translate->m[1][2] = 0.0;
    translate->m[2][2] = 1.0;
    translate->m[3][2] = 0.0;
    translate->m[4][2] = 0.0;
    
    translate->m[1][3] = 0.0;
    translate->m[2][3] = 0.0;
    translate->m[3][3] = 1.0;
    translate->m[4][3] = 0.0;

    translate->m[1][4] = x;
    translate->m[2][4] = y;
    translate->m[3][4] = z;
    translate->m[4][4] = 1.0;
}

/**
 * transformWireframe
 * Alex Gyori
 * October 17th, 2017
 * This method iterates through all the lines of a wireframe and applies a transformation to it based on the given transformation matrix.
 * wireframe_t *wf - wireframe to transform
 * dmatrix_t *transform - transform matrix to use for the transform operation
 */
void transformWireframe(wireframe_t *wf, dmatrix_t *transform) {
    lineList_t *current = wf->lines;
    while (current != NULL) {    
        current->l.start = *dmat_mult(transform, &current->l.start);
        current->l.end = *dmat_mult(transform, &current->l.end);
        current = current->next;
    }
}

/**
 * translateWireframe
 * Alex Gyori
 * October 17th, 2017
 * Translates a wireframe by x, y, and z.
 * wireframe_t *wf - wireframe to translate
 * double x - x value
 * double y - y value
 * double z - z value
 */
void translateWireframe(wireframe_t *wf, double x, double y, double z) { 
    dmatrix_t translate;
    dmat_alloc(&translate, 4, 4);
    getTranslateMatrix(&translate, x, y, z);
    transformWireframe(wf, &translate);
}

/**
 * scaleWireframe
 * Alex Gyori
 * October 17th, 2017
 * Scales a wireframe by x, y, and z.
 * wireframe_t *wf - wireframe to scale
 * double x - x value
 * double y - y value
 * double z - z value
 */
void scaleWireframe(wireframe_t *wf, double x, double y, double z) {
    dmatrix_t scale;
    dmat_alloc(&scale, 4, 4);
    getScalingMatrix(&scale, x, y, z);
    transformWireframe(wf, &scale);
}

/**
 * rotateWireframeX
 * Alex Gyori
 * October 17th, 2017
 * Rotates a wireframe about the X axis
 * wireframe_t *wf - wireframe to rotate
 * double angle - angle to rotate by
 */
void rotateWireframeX(wireframe_t *wf, double angle) {
    dmatrix_t rotate;
    dmat_alloc(&rotate, 4, 4);
    getRotateX(&rotate, angle);
    transformWireframe(wf, &rotate);
}

/**
 * rotateWireframeY
 * Alex Gyori
 * October 17th, 2017
 * Rotates a wireframe about the Y axis
 * wireframe_t *wf - wireframe to rotate
 * double angle - angle to rotate by
 */
void rotateWireframeY(wireframe_t *wf, double angle) {
    dmatrix_t rotate;
    dmat_alloc(&rotate, 4, 4);
    getRotateY(&rotate, angle);
    transformWireframe(wf, &rotate);
}

/**
 * rotateWireframeZ
 * Alex Gyori
 * October 17th, 2017
 * Rotates a wireframe about the Z axis
 * wireframe_t *wf - wireframe to rotate
 * double angle - angle to rotate by
 */
void rotateWireframeZ(wireframe_t *wf, double angle) {
    dmatrix_t rotate;
    dmat_alloc(&rotate, 4, 4);
    getRotateZ(&rotate, angle);
    transformWireframe(wf, &rotate);
}

/**
 * get2dCoords
 * Alex Gyori
 * October 17th, 2017
 * Converts the world coordinates of a wireframe to the camera coordinates.
 * dmatrix_t *camera - the camera matrix
 * wireframe_t *wf - the wireframe to get the coordinates of
 */
void get2dCoords(dmatrix_t *camera, wireframe_t *wf) {
    lineList_t *current = wf->lines;
    while (current != NULL) {    
        // run everything through camera matrix
        current->l.start = *perspective_projection(dmat_mult(camera, &current->l.start));
        current->l.end = *perspective_projection(dmat_mult(camera, &current->l.end));
        current = current->next;
    }
}

/**
 * drawWireframes
 * Alex Gyori
 * October 17th, 2017
 * Draws the wireframes on the screen
 * wireframe_t *wfs - the wireframes to draw
 * int numOfWireframes - the number of wireframes
 */
void drawWireframes(wireframe_t *wfs, int numOfWireframes) {
    Display *d;
    Window w;
    XEvent e;
    int s, i, x1, y1, x2, y2;
    
    unsigned int r, g, b;
    
    r = g = b = 0 ;

    d = InitX(d, &w, &s);
    
    SetCurrentColorX(d, &(DefaultGC(d, s)), r, g, b);
    
    lineList_t *current;
    while (1) {
        XNextEvent(d, &e);
        if (e.type == Expose) {
            for (i = 0; i < numOfWireframes; i++){
                current = wfs[i].lines;
                while (current != NULL) {
                    x1 = (int)current->l.start.m[1][1];
                    y1 = (int)current->l.start.m[2][1];
                    x2 = (int)current->l.end.m[1][1];
                    y2 = (int)current->l.end.m[2][1];
                    Bresenham(d,w,s,x1,y1,x2,y2);
                    current = current->next;
                }
            }
            
        }
        if(e.type == KeyPress)
            break;
        if(e.type == ClientMessage)
            break;
    }
    QuitX(d,w) ;
}

/**
 * createSphereWireframe
 * Alex Gyori
 * October 17th, 2017
 * Creates a wireframe for a sphere
 * double radius - the radius of the sphere
 * returns a pointer to the sphere wireframe
 */
wireframe_t *createSphereWireframe(double radius) {
    wireframe_t *wf = (wireframe_t *)malloc(sizeof(wireframe_t));
    (*wf).lines = (lineList_t *)malloc(sizeof(lineList_t));
    int i, j;
    double y1, y2;
    line_t baseLine, oldLine, newLine;
    double angle = 2 * M_PI / (double) SPHERE_LONGITUDES;
    dmatrix_t rotateY;
    dmat_alloc(&rotateY, 4, 4);
    getRotateY(&rotateY, angle);
    
    lineList_t *current = (*wf).lines;
    for (i = 0; i < SPHERE_LATITUDES; i++) {
        if (i != 0) { // do not need "next" logic on the first call
            current->next = (lineList_t *)malloc(sizeof(lineList_t)); // malloc and get the next current
            current = current->next; 
        }
        line_alloc(&current->l);
        
        // draw the longitudinal line_t segment
        y1 = radius - (double) i * (2 * radius / SPHERE_LATITUDES);
        y2 = radius - (double) (i+1) * (2 * radius / SPHERE_LATITUDES);
        current->l.start.m[1][1] = sqrt(pow(radius, 2) - pow(y1, 2));
        current->l.start.m[2][1] = y1;
        current->l.start.m[3][1] = 0.0;
        current->l.start.m[4][1] = 1.0;
        current->l.end.m[1][1] = sqrt(pow(radius, 2) - pow(y2, 2));
        current->l.end.m[2][1] = y2;
        current->l.end.m[3][1] = 0.0;
        current->l.end.m[4][1] = 1.0;
        
        baseLine = current->l;
        for (j = 0; j < SPHERE_LONGITUDES; j++) {
            // rotate the longitudinal line_t segment around vector (0,1,0) and connect adjacent endpoints
            // do the rotation for start and endpoints of the line_t, and save the coordinates of both lines
            
            getRotateY(&rotateY, j * angle);
            oldLine.start = *dmat_mult(&rotateY, &baseLine.start);
            oldLine.end = *dmat_mult(&rotateY, &baseLine.end);

            getRotateY(&rotateY, (j+1) * angle);
            newLine.start = *dmat_mult(&rotateY, &baseLine.start);
            newLine.end = *dmat_mult(&rotateY, &baseLine.end);

            current->next = (lineList_t *)malloc(sizeof(lineList_t)); // malloc and get the next current
            current = current->next; 
            line_alloc(&current->l);
            current->l = newLine;


            current->next = (lineList_t *)malloc(sizeof(lineList_t)); // malloc and get the next current
            current = current->next; 
            line_alloc(&current->l);
            current->l.start = oldLine.start;
            current->l.end = newLine.start;


            current->next = (lineList_t *)malloc(sizeof(lineList_t)); // malloc and get the next current
            current = current->next; 
            line_alloc(&current->l);
            current->l.start = oldLine.end;
            current->l.end = newLine.end;
        }
    }
    return wf;
}

/**
 * spawnSphere
 * Alex Gyori
 * October 17th, 2017
 * Creates a sphere with screen-coordinates
 * dmatrix_t *camera - the camera matrix
 * dmatrix_t *position - position to place the sphere
 * double radius - radius of the sphere
 * returns sphere wireframe with the screen coordinates
 */
wireframe_t *spawnSphere(dmatrix_t *camera, dmatrix_t *position, double radius) {
    wireframe_t *sphere = createSphereWireframe(radius);
    
    // translate
    translateWireframe(sphere, position->m[1][1], position->m[2][1], position->m[3][1]);

    // get the coords for drawing on the 2D screen
    get2dCoords(camera, sphere);
    
    return sphere;
}

/**
 * createTorusWireframe
 * Alex Gyori
 * October 17th, 2017
 * Creates a torus wireframe
 * double ringRadius - radius of the ring
 * double tubeRadius - radius of the tube of the torus
 * returns torus wireframe with the screen coordinates
 */
wireframe_t *createTorusWireframe(double ringRadius, double tubeRadius) {
    wireframe_t *wf = (wireframe_t *)malloc(sizeof(wireframe_t));
    (*wf).lines = (lineList_t *)malloc(sizeof(lineList_t));
    line_t baseLine, oldLine, newLine;
    dmatrix_t rotateY;
    dmat_alloc(&rotateY, 4, 4);
    double angle = 2 * M_PI / (double) TORUS_LONGITUDES;
    lineList_t *current = wf->lines;
    
    int i, j;
    for (i = 0; i < TORUS_TUBE_FACES; i++) {
        if (i != 0) { // do not need "next" logic on the first call
            current->next = (lineList_t *)malloc(sizeof(lineList_t)); // malloc and get the next current
            current = current->next; 
        }
        line_alloc(&current->l);
        
        current->l.start.m[1][1] = ringRadius + tubeRadius * sin(i * angle);
        current->l.start.m[2][1] = tubeRadius * cos(i * angle);
        current->l.start.m[3][1] = 0.0;
        current->l.start.m[4][1] = 1.0;
        
        current->l.end.m[1][1] = ringRadius + tubeRadius * sin((i+1) * angle);
        current->l.end.m[2][1] = tubeRadius * cos((i+1) * angle);
        current->l.end.m[3][1] = 0.0;
        current->l.end.m[4][1] = 1.0;
        
        baseLine = current->l; //set
        for (j = 0; j < TORUS_LONGITUDES; j++) {
            getRotateY(&rotateY, j * angle);
            oldLine.start = *dmat_mult(&rotateY, &baseLine.start);
            oldLine.end = *dmat_mult(&rotateY, &baseLine.end);

            getRotateY(&rotateY, (j+1) * angle);
            newLine.start = *dmat_mult(&rotateY, &baseLine.start);
            newLine.end = *dmat_mult(&rotateY, &baseLine.end);

            current->next = (lineList_t *)malloc(sizeof(lineList_t)); // malloc and get the next current
            current = current->next; 
            line_alloc(&current->l);
            current->l = newLine;


            current->next = (lineList_t *)malloc(sizeof(lineList_t)); // malloc and get the next current
            current = current->next; 
            line_alloc(&current->l);
            current->l.start = oldLine.start;
            current->l.end = newLine.start;


            current->next = (lineList_t *)malloc(sizeof(lineList_t)); // malloc and get the next current
            current = current->next; 
            line_alloc(&current->l);
            current->l.start = oldLine.end;
            current->l.end = newLine.end;
        }
    }
    return wf;
}

/**
 * spawnTorus
 * Alex Gyori
 * October 17th, 2017
 * Creates a torus with screen-coordinates
 * dmatrix_t *camera - the camera matrix
 * dmatrix_t *position - position to place the torus
 * double ringRadius - radius of the ring
 * double tubeRadius - radius of the tube
 * returns torus wireframe with the screen coordinates
 */
wireframe_t *spawnTorus(dmatrix_t *camera, dmatrix_t *position, double ringRadius, double tubeRadius) {
    wireframe_t *torus = createTorusWireframe(ringRadius, tubeRadius);
    
    // translate
    translateWireframe(torus, position->m[1][1], position->m[2][1], position->m[3][1]);
    
    // get the coords for drawing on the 2D screen
    get2dCoords(camera, torus);
    
    return torus;
}

/**
 * main
 * Alex Gyori
 * October 17th, 2017
 * Main function for assignment 2. Creates and draws the sphere and torus on the screen
 */
int main() {
    dmatrix_t C; /* The camera matrix */
    dmat_alloc(&C,4,4) ;
    C = *create_camera();
    
    dmatrix_t position;
    dmat_alloc(&position, 4, 1);
    position.m[1][1] = 10.0;
    position.m[2][1] = -5.0;
    position.m[3][1] = -5.0;
    position.m[4][1] = 1.0;
    double radius;
    radius = 10.0;
    wireframe_t sphere = *spawnSphere(&C, &position, radius);
    
    double ringRadius = 10.0;
    double tubeRadius = 2.0;
    dmatrix_t torusPosition;
    dmat_alloc(&torusPosition, 4, 1);
    torusPosition.m[1][1] = 0.0;
    torusPosition.m[2][1] = 0.0;
    torusPosition.m[3][1] = 0.0;
    torusPosition.m[4][1] = 1.0;
    wireframe_t torus = *spawnTorus(&C, &torusPosition, ringRadius, tubeRadius);
    scaleWireframe(&torus, 2.0, 0.5, 1.0);
    translateWireframe(&torus, -150.0, 10.0, 15.0);

    wireframe_t *wfs = (wireframe_t *)malloc(2*sizeof(wireframe_t));
    wfs[0] = sphere;
    wfs[1] = torus;
    drawWireframes(wfs, 2);
    
    return 0;
}
