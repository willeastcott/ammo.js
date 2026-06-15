const test = require('ava');
const loadAmmo = require('./helpers/load-ammo.js');

// Initialize global Ammo once for all tests:
test.before(async t => loadAmmo())

test('interpolation accessors', t => {
  // A rigid body to exercise the btCollisionObject interpolation accessors, which
  // btRigidBody inherits via `btRigidBody implements btCollisionObject`.
  var inertia = new Ammo.btVector3(0, 0, 0);
  var startTransform = new Ammo.btTransform();
  startTransform.setIdentity();
  var motionState = new Ammo.btDefaultMotionState(startTransform);
  var shape = new Ammo.btSphereShape(1);
  var rbInfo = new Ammo.btRigidBodyConstructionInfo(0, motionState, shape, inertia);
  var body = new Ammo.btRigidBody(rbInfo);

  // interpolation world transform round-trips
  var tx = new Ammo.btTransform();
  tx.setIdentity();
  tx.setOrigin(new Ammo.btVector3(1, 2, 3));
  body.setInterpolationWorldTransform(tx);
  var origin = body.getInterpolationWorldTransform().getOrigin();
  t.is([origin.x(), origin.y(), origin.z()].toString(), '1,2,3');

  // interpolation linear velocity round-trips
  body.setInterpolationLinearVelocity(new Ammo.btVector3(4, 5, 6));
  var linvel = body.getInterpolationLinearVelocity();
  t.is([linvel.x(), linvel.y(), linvel.z()].toString(), '4,5,6');

  // interpolation angular velocity round-trips
  body.setInterpolationAngularVelocity(new Ammo.btVector3(7, 8, 9));
  var angvel = body.getInterpolationAngularVelocity();
  t.is([angvel.x(), angvel.y(), angvel.z()].toString(), '7,8,9');
});
