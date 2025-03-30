const { Product, Tag, ProductTag, VideoLog, sequelize } = require('../models'); // Added VideoLog and sequelize
const { Op } = require('sequelize');

// ... (các hàm getAllProducts, createProduct, getProduct, updateProduct, deleteProduct, getTrash, restoreProduct, permanentDelete giữ nguyên) ...
exports.getAllProducts = async (req, res) => {
  try {
    // Destructure all potential query parameters
    // Add page and limit for pagination
    const { purchased, tags, search, sort, startDate, endDate, maxVideoCount, page = 1, limit = 30 } = req.query;
    const userId = req.userId;

    const where = { user_id: userId, deleted_at: null };
    const baseWhere = { user_id: userId, deleted_at: null }; // Base condition for counts

    // Filter by purchase status
    if (purchased !== undefined) {
      where.purchased = purchased === 'true';
    }

    // Filter by creation date range
    if (startDate && endDate) {
      // Assume startDate and endDate are 'YYYY-MM-DD' representing local UTC+7 dates
      // Convert to UTC boundaries for comparison with database (likely storing UTC)
      const startUTC = new Date(`${startDate}T00:00:00.000+07:00`); // Start of day in UTC+7
      const endUTC = new Date(`${endDate}T23:59:59.999+07:00`);   // End of day in UTC+7
      where.created_at = { [Op.between]: [startUTC, endUTC] };
    } else if (startDate) {
      const startUTC = new Date(`${startDate}T00:00:00.000+07:00`);
      where.created_at = { [Op.gte]: startUTC };
    } else if (endDate) {
      const endUTC = new Date(`${endDate}T23:59:59.999+07:00`);
      where.created_at = { [Op.lte]: endUTC };
    }

    // Filter by maximum video count
    if (maxVideoCount !== undefined) {
      const maxCount = parseInt(maxVideoCount);
      if (!isNaN(maxCount) && maxCount >= 0) {
        where.video_count = { [Op.lte]: maxCount };
      }
    }

    // Filter by search term
    if (search) {
      where[Op.or] = [
        { url: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } }
      ];
    }

    const include = [{ model: Tag }]; // Include Tags by default

    if (tags) {
      const tagIds = tags.split(',');
      // Add condition to the existing Tag include
      include[0].where = { id: tagIds };
      include[0].through = { attributes: [] }; // Don't include junction table attributes
    }

    const order = [];
    if (sort === 'newest') {
      order.push(['created_at', 'DESC']);
    } else if (sort === 'oldest') {
      order.push(['created_at', 'ASC']);
    } else if (sort === 'most_videos') {
      order.push(['video_count', 'DESC']);
    } else if (sort === 'least_videos') {
      order.push(['video_count', 'ASC']);
    } else {
        order.push(['created_at', 'DESC']); // Default sort
    }

    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Use findAndCountAll for pagination
    const { count, rows: products } = await Product.findAndCountAll({
      where, // Use the potentially filtered 'where' for the main list
      attributes: ['id', 'url', 'image_url', 'notes', 'purchased', 'video_count', 'created_at'], // Explicitly select attributes
      include,
      order
,
      limit: parseInt(limit),
      offset: offset,
      distinct: true // Important when using include with limit/offset
    });
    const [totalCount, pendingCount, purchasedCount] = await Promise.all([
        Product.count({ where: baseWhere }),
        Product.count({ where: { ...baseWhere, purchased: false } }),
        Product.count({ where: { ...baseWhere, purchased: true } })
    ]);

    res.json({
        products,
 // Products for the current page
        totalProducts: count, // Total products matching the filter
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        stats: {
            total: totalCount,
            pending: pendingCount,
            purchased: purchasedCount
        }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { url, image_url, notes, tags } = req.body;
    const userId = req.userId;

    const product = await Product.create({
      user_id: userId,
      url,
      image_url,
      notes,
      purchased: false,
      video_count: 0
    });

    if (tags && tags.length > 0) {
      const tagInstances = await Promise.all(
        tags.map(tagName => Tag.findOrCreate({
          where: { name: tagName },
          defaults: { name: tagName }
        }))
      );

      await product.setTags(tagInstances.map(([tag]) => tag.id));
    }

    const productWithTags = await Product.findByPk(product.id, {
      include: [Tag]
    });

    res.status(201).json(productWithTags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const product = await Product.findOne({
      where: { id, user_id: userId },
      attributes: ['id', 'url', 'image_url', 'notes', 'purchased', 'video_count', 'created_at', 'updated_at'], // Include timestamps
      include: [Tag, VideoLog] // Include VideoLogs
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    // Exclude video_count from direct update here
    const { url, image_url, notes, tags, purchased } = req.body;

    const product = await Product.findOne({
      where: { id, user_id: userId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.update({
      url: url !== undefined ? url : product.url,
      image_url: image_url !== undefined ? image_url : product.image_url,
      notes: notes !== undefined ? notes : product.notes,
      purchased: purchased !== undefined ? purchased : product.purchased
    });

    if (tags) { // Allow updating tags
      const tagInstances = await Promise.all(
        tags.map(tagName => Tag.findOrCreate({
          where: { name: tagName },
          defaults: { name: tagName }
        }))
      );
      await product.setTags(tagInstances.map(([tag]) => tag.id));
    }

    const updatedProduct = await Product.findByPk(id, {
      include: [Tag]
    });

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const product = await Product.findOne({
      where: { id, user_id: userId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.destroy(); // Soft delete

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTrash = async (req, res) => {
  try {
    const userId = req.userId;

    const products = await Product.findAll({
      where: {
        user_id: userId,
        deleted_at: { [Op.ne]: null }
      },
      include: [Tag],
      paranoid: false
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.restoreProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const product = await Product.findOne({
      where: { id, user_id: userId },
      paranoid: false
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.restore();

    res.json({ message: 'Product restored from trash' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.permanentDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const product = await Product.findOne({
      where: { id, user_id: userId },
      paranoid: false
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await VideoLog.destroy({ where: { product_id: id } });
    await product.destroy({ force: true });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Deprecated - use addVideoLog instead
// exports.incrementVideoCount = async (req, res) => { ... };

// Deprecated - use addVideoLog instead, total count is calculated
exports.setVideoCount = async (req, res) => {
    // This might still be useful for manually correcting the total count if needed
     try {
        const { id } = req.params;
        const userId = req.userId;
        const { count } = req.body;

        if (count === undefined || parseInt(count) < 0) {
            return res.status(400).json({ error: 'Valid non-negative count is required' });
        }

        const product = await Product.findOne({
          where: { id, user_id: userId }
        });

        if (!product) {
          return res.status(404).json({ error: 'Product not found' });
        }

        await product.update({ video_count: parseInt(count) });

        res.json({ video_count: parseInt(count) });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
};

// Updated function to add/update a video log entry and recalculate total
exports.addVideoLog = async (req, res) => {
  const t = await sequelize.transaction(); // Start transaction
  try {
    const { id } = req.params; // product_id
    const { date, count } = req.body;
    const userId = req.userId;
    const productId = parseInt(id);
    const videoCount = parseInt(count);

    // Verify product belongs to user
    const product = await Product.findOne({ where: { id: productId, user_id: userId }, transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!date || !count || videoCount < 0) { // Allow 0 to correct mistakes
        await t.rollback();
        return res.status(400).json({ error: 'Date and non-negative count are required' });
    }

    // Upsert the video log entry
    const [videoLog, created] = await VideoLog.upsert({
      product_id: productId,
      date: date,
      count: videoCount
    }, {
      transaction: t,
      returning: true,
      conflictFields: ['product_id', 'date'] // Assuming unique constraint on product_id and date
    });

    // Recalculate total video count for the product
    const totalVideos = await VideoLog.sum('count', {
        where: { product_id: productId },
        transaction: t
    });

    // Update the product's total video_count
    await product.update({ video_count: totalVideos || 0 }, { transaction: t });

    await t.commit(); // Commit transaction

    res.status(created ? 201 : 200).json(videoLog); // Return the created/updated log entry
  } catch (error) {
    await t.rollback(); // Rollback on error
    console.error("Error adding video log:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get video log for a specific date
exports.getVideoLogForDate = async (req, res) => {
    try {
        const { id } = req.params; // product_id
        const { date } = req.query; // date=YYYY-MM-DD
        const userId = req.userId;

        if (!date) {
            return res.status(400).json({ error: 'Date query parameter is required' });
        }

        // Verify product belongs to user (optional but good practice)
        const product = await Product.findOne({ where: { id, user_id: userId } });
        if (!product) {
          return res.status(404).json({ error: 'Product not found' });
        }

        const log = await VideoLog.findOne({
            where: { product_id: id, date: date }
        });

        res.json(log || { count: 0 }); // Return log or 0 count if no log exists for that date
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// (Optional) Function to get all video logs for a product
exports.getVideoLogs = async (req, res) => {
    try {
        const { id } = req.params; // product_id
        const userId = req.userId;

        const product = await Product.findOne({ where: { id, user_id: userId } });
        if (!product) {
          return res.status(404).json({ error: 'Product not found' });
        }

        const logs = await VideoLog.findAll({
            where: { product_id: id },
            order: [['date', 'DESC']]
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add a tag association to a product
exports.addProductTagAssociation = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, id: tagId } = req.body; // Frontend might send name for new tag or id for existing
    const userId = req.userId;

    const product = await Product.findOne({ where: { id: productId, user_id: userId } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let tag;
    if (tagId) {
        // If ID is provided, find the existing tag
        tag = await Tag.findByPk(tagId);
    } else if (name) {
        // If name is provided, find or create the tag
        [tag] = await Tag.findOrCreate({
            where: { name: name.trim() },
            defaults: { name: name.trim() }
        });
    } else {
        return res.status(400).json({ error: 'Tag name or ID is required' });
    }

    if (!tag) {
        return res.status(404).json({ error: 'Tag not found or could not be created' });
    }

    await product.addTag(tag); // Use Sequelize association method

    // Return the updated product with tags (optional, but good for confirmation)
    const updatedProduct = await Product.findByPk(productId, { include: [Tag] });
    res.status(200).json(updatedProduct);

  } catch (error) {
    console.error("Error adding product tag association:", error);
    res.status(500).json({ error: error.message });
  }
};

// Remove a tag association from a product
exports.removeProductTagAssociation = async (req, res) => {
  try {
    const { productId, tagId } = req.params;
    const userId = req.userId;

    const product = await Product.findOne({ where: { id: productId, user_id: userId } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const tag = await Tag.findByPk(tagId);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    await product.removeTag(tag); // Use Sequelize association method

    res.status(204).send(); // Successfully removed, no content to return

  } catch (error) {
    console.error("Error removing product tag association:", error);
    res.status(500).json({ error: error.message });
  }
};