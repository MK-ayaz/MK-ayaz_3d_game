/**
 * Generic object pool. Use for frequently-allocated objects (particles, bullets, damage numbers).
 *
 * Usage:
 *   const pool = new Pool(() => ({ x: 0, y: 0, z: 0, life: 0 }), 100)
 *   const obj = pool.acquire()
 *   obj.x = 5; obj.life = 1
 *   pool.release(obj)
 */
export class Pool {
  constructor(factory, size = 50) {
    this.factory = factory
    this.size = size
    this.pool = []
    for (let i = 0; i < size; i++) this.pool.push(factory())
  }
  acquire() {
    return this.pool.pop() || this.factory()
  }
  release(obj) {
    if (this.pool.length < this.size * 2) {
      this.pool.push(obj)
    }
  }
  releaseAll(objs) {
    for (const o of objs) this.release(o)
  }
}
