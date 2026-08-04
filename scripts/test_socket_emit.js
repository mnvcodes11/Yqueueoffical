const socket = require('../server/socket');

// Fake io that records emits
const events = [];
const fakeIo = {
  to(room) {
    return {
      emit(event, payload) {
        events.push({ room, event, payload });
      },
    };
  },
};

socket.__setIoForTests(fakeIo);

const sampleOrder = { _id: 'ord123', status: 'paid' };

// Test passing student id string
socket.emitOrderUpdateToStudent('stuABC', sampleOrder);

// Test passing populated student object with _id
socket.emitOrderUpdateToStudent({ _id: 'stuDEF', name: 'Test Student' }, sampleOrder);

// Test passing populated student object with id
socket.emitOrderUpdateToStudent({ id: 'stuGHI', name: 'Other' }, sampleOrder);

console.log('Captured events:');
console.log(JSON.stringify(events, null, 2));

// Basic assertions
if (
  events.length === 3 &&
  events[0].room === 'student:stuABC' &&
  events[1].room === 'student:stuDEF' &&
  events[2].room === 'student:stuGHI'
) {
  console.log('TEST PASSED');
  process.exit(0);
} else {
  console.error('TEST FAILED');
  process.exit(1);
}
