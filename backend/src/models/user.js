const db = require('../config/database');

const userSchema = (data) => ({
    email: data.email,
    name: data.name,
    passwordHash: data.passwordHash,
    createdAt: data.createdAt || new Date(),
    calendarConnected: data.calendarConnected ?? false,
    calendarRefreshToken: data.calendarRefreshToken ?? null,
    currentPlanId: data.currentPlanId ?? null
})

const createUser = async (id, data) => {
    const user = userSchema(data);
    await db.collection('users').doc(id).set(user);
    return {id : id, ...data}
}

const getUserById = async (id) => {
    const doc = await db.collection('users').doc(id).get();
    if (!doc)
        return null;
    return { id: doc.id, ...doc.data() };
}

const getUserByEmail = async (email) => {
    const snapshot = await db.collection('users')
    .where('email', '==', email)
    .limit(1)
    .get();

    if (snapshot.empty) 
        return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
}

const updateUser = async (id, updates) => {
    await db.collection('users').doc(id).update(updates);
}

const deleteUser = async (id) => {
    await db.collection('users').doc(id).delete();
}

module.exports = { createUser, getUserById, getUserByEmail, updateUser, deleteUser };