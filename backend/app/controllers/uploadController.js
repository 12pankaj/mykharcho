const db = require('../config/db');

exports.uploadProfilePic = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    try {
        await db.query(
            'UPDATE users SET profile_pic = $1 WHERE id = $2',
            [imageUrl, req.user.id]
        );
        res.json({ imageUrl, message: 'Profile picture updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating profile picture' });
    }
};
