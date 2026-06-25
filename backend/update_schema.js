const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://khanhhg24:123@wdp301.cmor6qd.mongodb.net/WDP301').then(async () => {
  const db = mongoose.connection.db;
  try {
    await db.command({
      collMod: 'inspection_images',
      validator: {}
    });
    console.log('Successfully updated inspection_images validator');
  } catch (err) {
    console.log('Error updating validator:', err.message);
  }
  
  try {
    await db.command({
      collMod: 'delivery_inspections',
      validator: {}
    });
    console.log('Successfully updated delivery_inspections validator');
  } catch (err) {
    console.log('Error updating validator delivery_inspections:', err.message);
  }

  mongoose.disconnect();
});
