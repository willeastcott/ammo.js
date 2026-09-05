const test = require('ava');
const loadAmmo = require('./helpers/load-ammo.js');

// Initialize global Ammo once for all tests:
test.before(async t => loadAmmo())

// A unit cube (half extents 0.5) as a btBvhTriangleMeshShape
function createUnitCubeBvh() {
  var h = 0.5;
  var v = [
    [-h, -h, -h], [h, -h, -h], [h, h, -h], [-h, h, -h],
    [-h, -h, h], [h, -h, h], [h, h, h], [-h, h, h]
  ];
  var faces = [
    [0, 1, 2], [0, 2, 3],
    [4, 6, 5], [4, 7, 6],
    [0, 4, 5], [0, 5, 1],
    [3, 2, 6], [3, 6, 7],
    [0, 3, 7], [0, 7, 4],
    [1, 5, 6], [1, 6, 2]
  ];

  var mesh = new Ammo.btTriangleMesh();
  faces.forEach(function (f) {
    mesh.addTriangle(
      new Ammo.btVector3(v[f[0]][0], v[f[0]][1], v[f[0]][2]),
      new Ammo.btVector3(v[f[1]][0], v[f[1]][1], v[f[1]][2]),
      new Ammo.btVector3(v[f[2]][0], v[f[2]][1], v[f[2]][2]),
      true);
  });

  return new Ammo.btBvhTriangleMeshShape(mesh, true, true);
}

function createStaticBody(shape, x) {
  var transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(x, 0, 0));
  var motionState = new Ammo.btDefaultMotionState(transform);
  var rbInfo = new Ammo.btRigidBodyConstructionInfo(0, motionState, shape, new Ammo.btVector3(0, 0, 0));
  return new Ammo.btRigidBody(rbInfo);
}

// Casts a ray straight down at x and returns the hit height, or null on a miss
function rayDownAt(world, x) {
  var from = new Ammo.btVector3(x, 10, 0);
  var to = new Ammo.btVector3(x, -10, 0);
  var callback = new Ammo.ClosestRayResultCallback(from, to);
  world.rayTest(from, to, callback);
  return callback.hasHit() ? callback.get_m_hitPointWorld().y() : null;
}

test('btScaledBvhTriangleMeshShape shares one BVH across scaled instances', t => {
  var bvh = createUnitCubeBvh();

  var unit = new Ammo.btScaledBvhTriangleMeshShape(bvh, new Ammo.btVector3(1, 1, 1));
  var doubled = new Ammo.btScaledBvhTriangleMeshShape(bvh, new Ammo.btVector3(2, 2, 2));
  var tall = new Ammo.btScaledBvhTriangleMeshShape(bvh, new Ammo.btVector3(1, 3, 1));

  // every instance wraps the same child shape
  t.is(Ammo.getPointer(unit.getChildShape()), Ammo.getPointer(bvh));
  t.is(Ammo.getPointer(doubled.getChildShape()), Ammo.getPointer(bvh));
  t.is(Ammo.getPointer(tall.getChildShape()), Ammo.getPointer(bvh));

  // each instance carries its own scale while the shared child stays unscaled
  var s = doubled.getLocalScaling();
  t.is([s.x(), s.y(), s.z()].toString(), '2,2,2');
  s = tall.getLocalScaling();
  t.is([s.x(), s.y(), s.z()].toString(), '1,3,1');
  s = bvh.getLocalScaling();
  t.is([s.x(), s.y(), s.z()].toString(), '1,1,1');

  // rescaling one instance leaves the others alone
  doubled.setLocalScaling(new Ammo.btVector3(4, 4, 4));
  s = doubled.getLocalScaling();
  t.is([s.x(), s.y(), s.z()].toString(), '4,4,4');
  s = unit.getLocalScaling();
  t.is([s.x(), s.y(), s.z()].toString(), '1,1,1');
  s = bvh.getLocalScaling();
  t.is([s.x(), s.y(), s.z()].toString(), '1,1,1');
  doubled.setLocalScaling(new Ammo.btVector3(2, 2, 2));

  // ray casts hit each instance at its own scaled height
  var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
  var dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  var broadphase = new Ammo.btDbvtBroadphase();
  var solver = new Ammo.btSequentialImpulseConstraintSolver();
  var world = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);

  world.addRigidBody(createStaticBody(unit, 0));
  world.addRigidBody(createStaticBody(doubled, 10));
  world.addRigidBody(createStaticBody(tall, 20));

  t.true(Math.abs(rayDownAt(world, 0) - 0.5) < 1e-4);
  t.true(Math.abs(rayDownAt(world, 10) - 1.0) < 1e-4);
  t.true(Math.abs(rayDownAt(world, 20) - 1.5) < 1e-4);

  // the unit instance is not widened by its scaled siblings
  t.is(rayDownAt(world, 0.75), null);
});
