class vec3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add(vec) {
        return new vec3(this.x + vec.x, this.y + vec.y, this.z + vec.z);
    }

    sub(vec) {
        return new vec3(this.x - vec.x, this.y - vec.y, this.z - vec.z);
    }

    mul(vec) {
        return new vec3(this.x * vec.x, this.y * vec.y, this.z * vec.z);
    }

    mulByValue(val) {
        return new vec3(this.x * val, this.y * val, this.z * val);
    }

    div(vec) {
        return new vec3(this.x / vec.x, this.y / vec.y, this.z / vec.z);
    }

    divByValue(val) {
        return new vec3(this.x / val, this.y / val, this.z / val);
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    squared_length() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    dot(vec) {
        return this.x * vec.x + this.y * vec.y + this.z * vec.z;
    }

    cross(vec) {
        return new vec3(
            this.y * vec.z - this.z * vec.y,
            -(this.x * vec.z - this.z * vec.x),
            this.x * vec.y - this.y * vec.x
        );
    }

    toUnit() {
        return this.divByValue(this.length());
    }

    log() {
        console.log(`[${this.x}, ${this.y}, ${this.z}]`);
    }
}

class ray {
    constructor(origin, direction) {
        this.origin = origin;
        this.direction = direction;
    }

    point_at_parameter(t) {
        return this.origin.add(this.direction.mulByValue(t));
    }
}

class camera {
    constructor(lower_left_corner, horizontal, vertical, origin) {
        this.lower_left_corner = lower_left_corner;
        this.horizontal = horizontal;
        this.vertical = vertical;
        this.origin = origin;
    }

    get_ray(u, v) {
        return new ray(this.origin, this.lower_left_corner.add(this.horizontal.mulByValue(u)).add(this.vertical.mulByValue(v)));
    }
 }

class hit_record {
    constructor(t, point, normal) {
        this.t = t;
        this.point = point;
        this.normal = normal;
    }
}

class hitable {
    hit(ray, t_min, t_max) {}
}

class hitable_list {
    constructor() {
        this.list = []
    }

    hit(ray, t_min, t_max) {
        let hit_record;
        let hit_anything = false;
        let closest_so_far = t_max;
        
        this.list.forEach(hitable => {
            const hit = hitable.hit(ray, t_min, closest_so_far);
            if (hit) {
                hit_anything = true;
                closest_so_far = hit.t;
                hit_record = hit;
            }
        });

        return hit_record;
    }
}

class sphere extends hitable {
    constructor(center, radius) {
        super();
        this.center = center;
        this.radius = radius;
    }

    hit(ray, t_min, t_max) {
        const oc = ray.origin.sub(this.center);
        const a = ray.direction.dot(ray.direction);
        const b = oc.dot(ray.direction);
        const c = oc.dot(oc) - (this.radius * this.radius);
        const d = b * b - a * c;
        if ( d > 0) {
            let tmp = (-b - Math.sqrt(b * b - a * c)) / a;
            if (tmp < t_max && tmp > t_min) {
                const t = tmp;
                const p = ray.point_at_parameter(t);
                const n = p.sub(this.center).divByValue(this.radius);
                return new hit_record(t, p, n);
            }
            tmp = (-b + Math.sqrt(b * b - a * c)) / a;
            if (tmp < t_max && tmp > t_min) {
                const t = tmp;
                const p = ray.point_at_parameter(t);
                const n = p.sub(this.center).divByValue(this.radius);
                return new hit_record(t, p, n);
            }
        }   
        return null;
    }
}

function random_in_unit_sphere() {
    let p;
    do {
        p = (new vec3(Math.random(), Math.random(), Math.random()).mulByValue(2)).sub(new vec3(1, 1, 1));
    } while(p.squared_length() >= 1);
    return p;
}

function color(r, hitable_list) {
    const hit = hitable_list.hit(r, 0.001, Number.MAX_VALUE);
    if (hit) {
        const target = hit.point.add(hit.normal.add(random_in_unit_sphere()));
        return color(new ray(hit.point, target.sub(hit.point)), hitable_list).mulByValue(0.5);
    } else {
        const unit_direction = r.direction.toUnit();
        const t = 0.5 * (unit_direction.y + 1);
        return (new vec3(1, 1, 1).mulByValue(1 - t)).add(new vec3(0.5, 0.7, 1).mulByValue(t));
    }
}

function render() {
    console.log('Rendering...');

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const {height: h, width: w} = canvas
    const samples = 100;

    const lower_left_corner = new vec3(-2, -1, -1);
    const horizontal = new vec3(4, 0, 0);
    const vertical = new vec3(0, 2, 0);
    const origin = new vec3(0, 0, 0);
    const cam = new camera(lower_left_corner, horizontal, vertical, origin);

    const world = new hitable_list()
    world.list.push(new sphere(new vec3(0, 0, -1), 0.5));
    world.list.push(new sphere(new vec3(0, -100.5, -1), 100));

    for (let y = h - 1; y >= 0; y--) {
        for (let x = 0; x < w; x++) {
            let c = new vec3(0, 0, 0);
            for(let s = 0; s < samples; s++) {
                const u = (x + Math.random()) / w;
                const v = (y + Math.random()) / h;
                const r = cam.get_ray(u, v);
                c = c.add(color(r, world));
            }
            c = c.divByValue(samples);
            c = new vec3(Math.sqrt(c.x), Math.sqrt(c.y), Math.sqrt(c.z));

            const ir = Math.floor(255 * c.x);
            const ig = Math.floor(255 * c.y);
            const ib = Math.floor(255 * c.z);
            ctx.fillStyle = `rgb(${ir}, ${ig}, ${ib})`;
            ctx.fillRect(w - x, h - y, 1, 1);
        }
    }

    console.log('Done!');
}