/* eslint-disable no-mixed-operators,max-statements-per-line */
// according to https://jsperf.com/obj-vs-array-view-access/1 , Float64Array is the best here
import { IPointData, Matrix, Point } from '@pixi/math';
import { AFFINE } from '../base';

const mat3id = [1, 0, 0, 0, 1, 0, 0, 0, 1];

export class Matrix2d
{
    /**
     * A default (identity) matrix
     *
     * @static
     * @const
     */
    static readonly IDENTITY = new Matrix2d();

    /**
     * A temp matrix
     *
     * @static
     * @const
     */
    static readonly TEMP_MATRIX = new Matrix2d();

    /**
     * mat3 implementation through array of 9 elements
     */
    mat3: Float64Array;

    floatArray: Float32Array = null;

    constructor(backingArray?: ArrayLike<number>)
    {
        this.mat3 = new Float64Array(backingArray || mat3id);
    }

    get a(): number
    {
        return this.mat3[0] / this.mat3[8];
    }

    set a(value: number)
    {
        this.mat3[0] = value * this.mat3[8];
    }

    get b(): number
    {
        return this.mat3[1] / this.mat3[8];
    }

    set b(value: number)
    {
        this.mat3[1] = value * this.mat3[8];
    }

    get c(): number
    {
        return this.mat3[3] / this.mat3[8];
    }

    set c(value: number)
    {
        this.mat3[3] = value * this.mat3[8];
    }

    get d(): number
    {
        return this.mat3[4] / this.mat3[8];
    }

    set d(value: number)
    {
        this.mat3[4] = value * this.mat3[8];
    }

    get tx(): number
    {
        return this.mat3[6] / this.mat3[8];
    }

    set tx(value: number)
    {
        this.mat3[6] = value * this.mat3[8];
    }

    get ty(): number
    {
        return this.mat3[7] / this.mat3[8];
    }

    set ty(value: number)
    {
        this.mat3[7] = value * this.mat3[8];
    }

    set(a: number, b: number, c: number, d: number, tx: number, ty: number): this
    {
        const mat3 = this.mat3;

        mat3[0] = a;
        mat3[1] = b;
        mat3[2] = 0;
        mat3[3] = c;
        mat3[4] = d;
        mat3[5] = 0;
        mat3[6] = tx;
        mat3[7] = ty;
        mat3[8] = 1;

        return this;
    }

    toArray(transpose?: boolean, out?: Float32Array): Float32Array
    {
        if (!this.floatArray)
        {
            this.floatArray = new Float32Array(9);
        }

        const array = out || this.floatArray;
        const mat3 = this.mat3;

        if (transpose)
        {
            array[0] = mat3[0];
            array[1] = mat3[1];
            array[2] = mat3[2];
            array[3] = mat3[3];
            array[4] = mat3[4];
            array[5] = mat3[5];
            array[6] = mat3[6];
            array[7] = mat3[7];
            array[8] = mat3[8];
        }
        else
        {
            // this branch is NEVER USED in pixi
            array[0] = mat3[0];
            array[1] = mat3[3];
            array[2] = mat3[6];
            array[3] = mat3[1];
            array[4] = mat3[4];
            array[5] = mat3[7];
            array[6] = mat3[2];
            array[7] = mat3[5];
            array[8] = mat3[8];
        }

        return array;
    }

    // TODO: remove props
    apply(pos: IPointData, newPos: IPointData): IPointData
    {
        newPos = newPos || new Point();

        const mat3 = this.mat3;
        const x = pos.x;
        const y = pos.y;

        const z = 1.0 / (mat3[2] * x + mat3[5] * y + mat3[8]);

        newPos.x = z * (mat3[0] * x + mat3[3] * y + mat3[6]);
        newPos.y = z * (mat3[1] * x + mat3[4] * y + mat3[7]);

        return newPos;
    }

    translate(tx: number, ty: number): this
    {
        const mat3 = this.mat3;

        mat3[0] += tx * mat3[2];
        mat3[1] += ty * mat3[2];
        mat3[3] += tx * mat3[5];
        mat3[4] += ty * mat3[5];
        mat3[6] += tx * mat3[8];
        mat3[7] += ty * mat3[8];

        return this;
    }

    scale(x: number, y: number): this
    {
        const mat3 = this.mat3;

        mat3[0] *= x;
        mat3[1] *= y;
        mat3[3] *= x;
        mat3[4] *= y;
        mat3[6] *= x;
        mat3[7] *= y;

        return this;
    }

    scaleAndTranslate(scaleX: number, scaleY: number, tx: number, ty: number): void
    {
        const mat3 = this.mat3;

        mat3[0] = scaleX * mat3[0] + tx * mat3[2];
        mat3[1] = scaleY * mat3[1] + ty * mat3[2];
        mat3[3] = scaleX * mat3[3] + tx * mat3[5];
        mat3[4] = scaleY * mat3[4] + ty * mat3[5];
        mat3[6] = scaleX * mat3[6] + tx * mat3[8];
        mat3[7] = scaleY * mat3[7] + ty * mat3[8];
    }

    // TODO: remove props
    applyInverse(pos: IPointData, newPos: IPointData): IPointData
    {
        newPos = newPos || new Point();

        const a = this.mat3;
        const x = pos.x;
        const y = pos.y;

        const a00 = a[0]; const a01 = a[3]; const a02 = a[6];
        const a10 = a[1]; const a11 = a[4]; const a12 = a[7];
        const a20 = a[2]; const a21 = a[5]; const
            a22 = a[8];

        const newX = (a22 * a11 - a12 * a21) * x + (-a22 * a01 + a02 * a21) * y + (a12 * a01 - a02 * a11);
        const newY = (-a22 * a10 + a12 * a20) * x + (a22 * a00 - a02 * a20) * y + (-a12 * a00 + a02 * a10);
        const newZ = (a21 * a10 - a11 * a20) * x + (-a21 * a00 + a01 * a20) * y + (a11 * a00 - a01 * a10);

        newPos.x = newX / newZ;
        newPos.y = newY / newZ;

        return newPos;
    }

    invert(): Matrix2d
    {
        const a = this.mat3;

        const a00 = a[0]; const a01 = a[1]; const a02 = a[2];
        const a10 = a[3]; const a11 = a[4]; const a12 = a[5];
        const a20 = a[6]; const a21 = a[7]; const a22 = a[8];

        const b01 = a22 * a11 - a12 * a21;
        const b11 = -a22 * a10 + a12 * a20;
        const b21 = a21 * a10 - a11 * a20;

        // Calculate the determinant
        let det = a00 * b01 + a01 * b11 + a02 * b21;

        if (!det)
        {
            return this;
        }
        det = 1.0 / det;

        a[0] = b01 * det;
        a[1] = (-a22 * a01 + a02 * a21) * det;
        a[2] = (a12 * a01 - a02 * a11) * det;
        a[3] = b11 * det;
        a[4] = (a22 * a00 - a02 * a20) * det;
        a[5] = (-a12 * a00 + a02 * a10) * det;
        a[6] = b21 * det;
        a[7] = (-a21 * a00 + a01 * a20) * det;
        a[8] = (a11 * a00 - a01 * a10) * det;

        return this;
    }

    identity(): Matrix2d
    {
        const mat3 = this.mat3;

        mat3[0] = 1;
        mat3[1] = 0;
        mat3[2] = 0;
        mat3[3] = 0;
        mat3[4] = 1;
        mat3[5] = 0;
        mat3[6] = 0;
        mat3[7] = 0;
        mat3[8] = 1;

        return this;
    }

    clone(): Matrix2d
    {
        return new Matrix2d(this.mat3);
    }

    copyTo2dOr3d(matrix: Matrix2d): Matrix2d
    {
        const mat3 = this.mat3;
        const ar2 = matrix.mat3;

        ar2[0] = mat3[0];
        ar2[1] = mat3[1];
        ar2[2] = mat3[2];
        ar2[3] = mat3[3];
        ar2[4] = mat3[4];
        ar2[5] = mat3[5];
        ar2[6] = mat3[6];
        ar2[7] = mat3[7];
        ar2[8] = mat3[8];

        return matrix;
    }

    /**
     * legacy method, change the values of given pixi matrix
     * @param matrix
     * @param affine
     * @param preserveOrientation
     * @return matrix
     */
    copyTo(matrix: Matrix, affine?: AFFINE, preserveOrientation?: boolean): Matrix
    {
        const mat3 = this.mat3;
        const d = 1.0 / mat3[8];
        const tx = mat3[6] * d; const
            ty = mat3[7] * d;

        matrix.a = (mat3[0] - mat3[2] * tx) * d;
        matrix.b = (mat3[1] - mat3[2] * ty) * d;
        matrix.c = (mat3[3] - mat3[5] * tx) * d;
        matrix.d = (mat3[4] - mat3[5] * ty) * d;
        matrix.tx = tx;
        matrix.ty = ty;

        if (affine >= 2)
        {
            let D = matrix.a * matrix.d - matrix.b * matrix.c;

            if (!preserveOrientation)
            {
                D = Math.abs(D);
            }
            if (affine === AFFINE.POINT)
            {
                if (D > 0)
                {
                    D = 1;
                }
                else D = -1;
                matrix.a = D;
                matrix.b = 0;
                matrix.c = 0;
                matrix.d = D;
            }
            else if (affine === AFFINE.AXIS_X)
            {
                D /= Math.sqrt(matrix.b * matrix.b + matrix.d * matrix.d);
                matrix.c = 0;
                matrix.d = D;
            }
            else if (affine === AFFINE.AXIS_Y)
            {
                D /= Math.sqrt(matrix.a * matrix.a + matrix.c * matrix.c);
                matrix.a = D;
                matrix.c = 0;
            }
            else if (affine === AFFINE.AXIS_XR)
            {
                matrix.a = matrix.d * D;
                matrix.c = -matrix.b * D;
            }
        }

        return matrix;
    }

    /**
     * legacy method, change the values of given pixi matrix
     * @param matrix
     * @return
     */
    copyFrom(matrix: Matrix): this
    {
        const mat3 = this.mat3;

        mat3[0] = matrix.a;
        mat3[1] = matrix.b;
        mat3[2] = 0;
        mat3[3] = matrix.c;
        mat3[4] = matrix.d;
        mat3[5] = 0;
        mat3[6] = matrix.tx;
        mat3[7] = matrix.ty;
        mat3[8] = 1.0;

        return this;
    }

    setToMultLegacy(pt: Matrix, lt: Matrix2d): this
    {
        const out = this.mat3;
        const b = lt.mat3;

        const a00 = pt.a; const a01 = pt.b;
        const a10 = pt.c; const a11 = pt.d;
        const a20 = pt.tx; const a21 = pt.ty;

        const b00 = b[0]; const b01 = b[1]; const b02 = b[2];
        const b10 = b[3]; const b11 = b[4]; const b12 = b[5];
        const b20 = b[6]; const b21 = b[7]; const b22 = b[8];

        out[0] = b00 * a00 + b01 * a10 + b02 * a20;
        out[1] = b00 * a01 + b01 * a11 + b02 * a21;
        out[2] = b02;

        out[3] = b10 * a00 + b11 * a10 + b12 * a20;
        out[4] = b10 * a01 + b11 * a11 + b12 * a21;
        out[5] = b12;

        out[6] = b20 * a00 + b21 * a10 + b22 * a20;
        out[7] = b20 * a01 + b21 * a11 + b22 * a21;
        out[8] = b22;

        return this;
    }

    setToMultLegacy2(pt: Matrix2d, lt: Matrix): this
    {
        const out = this.mat3;
        const a = pt.mat3;

        const a00 = a[0]; const a01 = a[1]; const a02 = a[2];
        const a10 = a[3]; const a11 = a[4]; const a12 = a[5];
        const a20 = a[6]; const a21 = a[7]; const a22 = a[8];

        const b00 = lt.a; const b01 = lt.b;
        const b10 = lt.c; const b11 = lt.d;
        const b20 = lt.tx; const
            b21 = lt.ty;

        out[0] = b00 * a00 + b01 * a10;
        out[1] = b00 * a01 + b01 * a11;
        out[2] = b00 * a02 + b01 * a12;

        out[3] = b10 * a00 + b11 * a10;
        out[4] = b10 * a01 + b11 * a11;
        out[5] = b10 * a02 + b11 * a12;

        out[6] = b20 * a00 + b21 * a10 + a20;
        out[7] = b20 * a01 + b21 * a11 + a21;
        out[8] = b20 * a02 + b21 * a12 + a22;

        return this;
    }

    // that's transform multiplication we use
    setToMult(pt: Matrix2d, lt: Matrix2d): this
    {
        const out = this.mat3;
        const a = pt.mat3; const
            b = lt.mat3;

        const a00 = a[0]; const a01 = a[1]; const a02 = a[2];
        const a10 = a[3]; const a11 = a[4]; const a12 = a[5];
        const a20 = a[6]; const a21 = a[7]; const a22 = a[8];

        const b00 = b[0]; const b01 = b[1]; const b02 = b[2];
        const b10 = b[3]; const b11 = b[4]; const b12 = b[5];
        const b20 = b[6]; const b21 = b[7]; const b22 = b[8];

        out[0] = b00 * a00 + b01 * a10 + b02 * a20;
        out[1] = b00 * a01 + b01 * a11 + b02 * a21;
        out[2] = b00 * a02 + b01 * a12 + b02 * a22;

        out[3] = b10 * a00 + b11 * a10 + b12 * a20;
        out[4] = b10 * a01 + b11 * a11 + b12 * a21;
        out[5] = b10 * a02 + b11 * a12 + b12 * a22;

        out[6] = b20 * a00 + b21 * a10 + b22 * a20;
        out[7] = b20 * a01 + b21 * a11 + b22 * a21;
        out[8] = b20 * a02 + b21 * a12 + b22 * a22;

        return this;
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    prepend(lt: any): this
    {
        if (lt.mat3)
        {
            return this.setToMult(lt, this);
        }

        return this.setToMultLegacy(lt, this);
    }
}
