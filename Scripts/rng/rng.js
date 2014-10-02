var SeededRNG = (function () {
    function SeededRNG(randomSeed, type, distribution) {
        if (typeof randomSeed === "undefined") { randomSeed = Date.now(); }
        if (typeof type === "undefined") { type = 4; }
        if (typeof distribution === "undefined") { distribution = 0; }
        this.randomSeedInit = randomSeed;
        this.randomSeed = randomSeed;

        this.type = type;
        switch (this.type) {
            case -1:
                this._rand = Math.random;
                break;
            case 0:
                this._rand = this.randCentral;
                break;
            case 1:
                this._rand = this.randU;
                break;
            case 2:
                this._rand = this.randCLib;
                break;
            case 3:
                this._rand = this.randMSWin;
                break;
            case 4:
                this._rand = this.randXorshift;
                break;
            case 5:
                this._rand = this.randMersenne;
                break;
            default:
                this._rand = this.randXorshift;
        }

        this.distribution = distribution;
        switch (this.distribution) {
            case 0:
                this.rand = this._rand;
                break;
            case 1:
                this.rand = this.randNorm;
                break;
            default:
                this.rand = this._rand;
        }

        // Xorshift initialization
        this.x = 123456789;
        this.y = 362436069;
        this.z = 521288629;

        // Mersenne Twister initialization
        this.N = 624;
        this.M = 397;
        this.MATRIX_A = 0x9908b0df;
        this.UPPER_MASK = 0x80000000;
        this.LOWER_MASK = 0x7fffffff;
        this.mt = new Array(this.N);
        this.mti = this.N + 1;

        /* initializes mt[N] with a seed */
        this.mt[0] = this.randomSeed >>> 0;
        for (this.mti = 1; this.mti < this.N; this.mti++) {
            var s = this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30);
            this.mt[this.mti] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + (s & 0x0000ffff) * 1812433253) + this.mti;

            /* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
            /* In the previous versions, MSBs of the seed affect */
            /* only MSBs of the array mt[]. */
            /* 2002/01/09 modified by Makoto Matsumoto */
            this.mt[this.mti] >>>= 0;
            /* for >32 bit machines */
        }
    }
    // Normal (Gausian) distribution
    // See: http://www.design.caltech.edu/erik/Misc/Gaussian.html
    SeededRNG.prototype.randNorm = function () {
        var x1, x2, rad;

        do {
            x1 = 2 * this._rand() - 1;
            x2 = 2 * this._rand() - 1;
            rad = x1 * x1 + x2 * x2;
        } while(rad >= 1 || rad == 0);

        var c = Math.sqrt(-2 * Math.log(rad) / rad);

        return x1 * c;
    };

    // The Central Randomizer 1.3 (C) 1997 by Paul Houle (paul@honeylocust.com)
    // See:  http://www.honeylocust.com/javascript/randomizer.html
    SeededRNG.prototype.randCentral = function () {
        this.randomSeed = (this.randomSeed * 9301 + 49297) % 233280;
        return this.randomSeed / 233280.0;
    };

    // IBM RANDU
    // See: http://en.wikipedia.org/wiki/RANDU
    SeededRNG.prototype.randU = function () {
        this.randomSeed = (this.randomSeed * 65539) % 2147483648;
        return this.randomSeed / 2147483648.0;
    };

    // rand() function from C Standard Library
    SeededRNG.prototype.randCLib = function () {
        this.randomSeed = this.randomSeed * 1103515245 + 12345;
        this.randomSeed = (this.randomSeed / 65536) % 32768;

        return this.randomSeed / 32767.0;
    };

    // Microsoft Windows default random number generator
    // See: http://blog.olivier.coupelon.net/2008/02/microsoft-windows-default-random-number.html
    SeededRNG.prototype.randMSWin = function () {
        this.randomSeed = this.randomSeed * 214013 + 2531011;
        this.randomSeed = (this.randomSeed / 65536) % 32768;
        return this.randomSeed / 32767.0;
    };

    // Linear Congruential Generator
    // See: http://en.wikipedia.org/wiki/Linear_congruential_generator
    SeededRNG.prototype.randLCG = function (modulus, multiplier, increment) {
        this.randomSeed = (this.randomSeed * multiplier + increment) % modulus;
        return this.randomSeed / modulus;
    };

    // Xorshift algorithm
    // See: https://github.com/StickyBeat/pseudo-random-generator-xor-shift
    SeededRNG.prototype.randXorshift = function () {
        var t = (this.x ^ (this.x << 11)) & 0x7fffffff;
        this.x = this.y;
        this.y = this.z;
        this.z = this.randomSeed;
        this.randomSeed = (this.randomSeed ^ (this.randomSeed >> 19) ^ (t ^ (t >> 8)));
        return this.randomSeed / 2147483648.0;
    };

    // Mersenne Twister algorithm
    // See: https://gist.github.com/banksean/300494
    SeededRNG.prototype.randMersenne = function () {
        var y;
        var mag01 = new Array(0x0, this.MATRIX_A);

        if (this.mti >= this.N) {
            var kk;

            for (kk = 0; kk < this.N - this.M; kk++) {
                y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
                this.mt[kk] = this.mt[kk + this.M] ^ (y >>> 1) ^ mag01[y & 0x1];
            }
            for (; kk < this.N - 1; kk++) {
                y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
                this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
            }
            y = (this.mt[this.N - 1] & this.UPPER_MASK) | (this.mt[0] & this.LOWER_MASK);
            this.mt[this.N - 1] = this.mt[this.M - 1] ^ (y >>> 1) ^ mag01[y & 0x1];

            this.mti = 0;
        }

        y = this.mt[this.mti++];

        /* Tempering */
        y ^= (y >>> 11);
        y ^= (y << 7) & 0x9d2c5680;
        y ^= (y << 15) & 0xefc60000;
        y ^= (y >>> 18);

        return (y >>> 0) * (1.0 / 4294967295.0);
    };
    return SeededRNG;
})();
//# sourceMappingURL=rng.js.map
