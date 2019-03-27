import { Material } from "./material.js";
import { Ray } from "../ray.js";
import { glMatrix, vec2 } from "./../dependencies/gl-matrix-es6.js";
import { Globals } from "../globals.js";

class EmitterMaterial extends Material {
    constructor(options) {
        super();

        if(!options) options = { };

        options.color        = options.color !== undefined ? options.color : [1,1,1];
        options.opacity      = options.opacity !== undefined ? options.opacity : 1;
        options.sampleWeight = options.sampleWeight !== undefined ? options.sampleWeight : 1;

        this.color = options.color;
        this.opacity = options.opacity;
        this.sampleWeight = options.sampleWeight;
    }

    computeScattering(ray, input_normal, t, contribution, worldAttenuation) {
        let scatterResult = { };

        // opacity test, if it passes we're going to let the ray pass through the object
        if(Math.random() > this.opacity) {
            
            // Compute contribution BEFORE CHANGING THE RAY.O ARRAY!
            let dot = Math.abs(  vec2.dot(ray.d, input_normal)  );
            let absorbtionDifference = 1 - dot;
            let opacityDot = dot + absorbtionDifference * (1 - this.opacity);

            contribution *= opacityDot;
            contribution *= Math.exp(-t * worldAttenuation);

            

            let newOrigin = vec2.create();
            vec2.scaleAndAdd(newOrigin, ray.o, ray.d, t + Globals.epsilon); // it's important that the epsilon value is subtracted/added instead of doing t * 0.999999 since that caused floating point precision issues
            vec2.copy(ray.o, newOrigin);



            scatterResult.contribution = contribution;

            return { contribution: contribution };
        }



        // we're going to pick a random point in the hemisphere
        let dot = vec2.dot(ray.d, input_normal);   // ** REMEMBER !! **    the dot between ray.d & normal here is expected to be LESS than zero! 
                                                    //                      that's because the incident light ray should be negated before making the dot product
        let normal = vec2.clone(input_normal);
        if(dot > 0.0) {     // if it's greater than zero, we have a problem!  see here ^^^
            vec2.negate(normal, normal);
        }            





        // Compute contribution BEFORE CHANGING THE RAY.O ARRAY!
        // one of your older bug involved placing those lines AFTER changing the ray.o array
        dot = Math.abs(  vec2.dot(ray.d, input_normal)  );
        contribution *= dot;
        contribution *= Math.exp(-t * worldAttenuation);
        




        
        let newDirection = vec2.create();
        let nv = normal;
        let nu = vec2.fromValues(-normal[1], normal[0]);

        let angleInHemisphere = Math.random() * Math.PI;
        let nudx = Math.cos(angleInHemisphere) * nu[0];
        let nudy = Math.cos(angleInHemisphere) * nu[1];
        let nvdx = Math.sin(angleInHemisphere) * nv[0];
        let nvdy = Math.sin(angleInHemisphere) * nv[1];

        newDirection[0] = nudx + nvdx;
        newDirection[1] = nudy + nvdy;
        vec2.normalize(newDirection, newDirection);



        // bounce off again
        let newOrigin = vec2.create();
        vec2.scaleAndAdd(newOrigin, ray.o, ray.d, t - Globals.epsilon); // it's important that the epsilon value is subtracted/added instead of doing t * 0.999999 since that caused floating point precision issues
    

        vec2.copy(ray.o, newOrigin);
        vec2.copy(ray.d, newDirection);    

        
        scatterResult.contribution = contribution;
        return { contribution: contribution };
    }

    getPhoton(geometryObject) {
        let res = geometryObject.getRandomPoint();
        let point = res.p;
        // avoids self-intersections
        point[0] += res.normal[0] * 0.00001;    // normals are always normalized to a length of 1, so there shouldn't be a precision problem with *= 0.00001
        point[1] += res.normal[1] * 0.00001;
        let normal = res.normal;

        let newDirection = vec2.create();
        let nv = normal;
        let nu = vec2.fromValues(-normal[1], normal[0]);

        let angleInHemisphere = Math.random() * Math.PI;
        let nudx = Math.cos(angleInHemisphere) * nu[0];
        let nudy = Math.cos(angleInHemisphere) * nu[1];
        let nvdx = Math.sin(angleInHemisphere) * nv[0];
        let nvdy = Math.sin(angleInHemisphere) * nv[1];

        newDirection[0] = nudx + nvdx;
        newDirection[1] = nudy + nvdy;
        vec2.normalize(newDirection, newDirection);

        return {
            ray:   new Ray(point, newDirection),
            color: this.color
        }
    }
}

export { EmitterMaterial }