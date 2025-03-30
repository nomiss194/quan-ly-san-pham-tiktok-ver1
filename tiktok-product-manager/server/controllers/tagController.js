const { Tag } = require('../models');

exports.getAllTags = async (req, res) => {
  try {
    // Ensure color is included
    const tags = await Tag.findAll({ order: [['name', 'ASC']] });
    res.json(tags);
  } catch (error) {
    console.error("Error fetching all tags:", error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
};

exports.createTag = async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Tag name is required.' });
    }
    // Basic validation for color format (optional but recommended)
    const colorRegex = /^#[0-9A-F]{6}$/i;
    const validColor = color && colorRegex.test(color) ? color : null; // Store null if invalid/missing

    const tag = await Tag.create({ name, color: validColor });
    res.status(201).json(tag);
  } catch (error) {
     if (error.name === 'SequelizeUniqueConstraintError') {
         return res.status(400).json({ error: 'Tag name already exists.' });
     }
    console.error("Error creating tag:", error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
};

exports.updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    const tag = await Tag.findByPk(id);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const updateData = {};
    if (name !== undefined) {
        if (!name) return res.status(400).json({ error: 'Tag name cannot be empty.' });
        updateData.name = name;
    }
    if (color !== undefined) {
        const colorRegex = /^#[0-9A-F]{6}$/i;
        if (color === '' || color === null) {
             updateData.color = null; // Allow setting color back to null/default
        } else if (color && colorRegex.test(color)) {
             updateData.color = color;
        } else {
            console.warn(`Invalid color format received: ${color}. Ignoring color update.`);
            // Optionally return an error instead of just warning:
            // return res.status(400).json({ error: 'Invalid color format. Use #RRGGBB or empty string.' });
        }
    }

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update provided (name or color)' });
    }

    await tag.update(updateData);
    res.json(tag);

  } catch (error) {
     if (error.name === 'SequelizeUniqueConstraintError') {
         return res.status(400).json({ error: 'Tag name already exists.' });
     }
    console.error("Error updating tag:", error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
};

exports.deleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    const tag = await Tag.findByPk(id);

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // Consider implications: deleting a tag removes it from all products.
    await tag.destroy();
    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error("Error deleting tag:", error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
};
