// app/model/role.js
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const RoleSchema = new Schema(
    {
      __v: { type: Number, select: false },
      name: { type: String, unique: true, required: true },
      access: { type: String, required: true, default: 'user' },
      extra: { type: mongoose.Schema.Types.Mixed },
    },
    {
      timestamps: { createdAt: 'create_at', updatedAt: 'update_at' },
    }
  );

  return mongoose.model('Role', RoleSchema);
};
