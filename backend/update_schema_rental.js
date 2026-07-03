const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://khanhhg24:123@wdp301.cmor6qd.mongodb.net/WDP301').then(async () => {
  const db = mongoose.connection.db;
  try {
    await db.command({
      collMod: 'rental_inspections',
      validator: {}
    });
    console.log('Successfully updated rental_inspections validator');
  } catch (err) {
    console.log('Error updating validator rental_inspections:', err.message);
  }
  
  try {
    await db.command({
      collMod: 'rental_inspection_images',
      validator: {}
    });
    console.log('Successfully updated rental_inspection_images validator');
  } catch (err) {
    console.log('Error updating validator rental_inspection_images:', err.message);
  }

  mongoose.disconnect();
});
