"use strict";
const Sequelize = require('sequelize');

const findOne = (db, selectionCriteria, projection = {}) => {
	return new Promise((resolve, reject) => {
		db.findOne({
			where: selectionCriteria,
			[projection.fieldsToFetch ?
				"attributes" :
				""
			]: projection.fieldsToFetch,
			[projection.fieldsToIgnore ? "attributes" : ""]: {
				exclude: projection.fieldsToIgnore
			}
		}).then(res => 
				resolve(res?.dataValues)
			)
        .catch(err => reject(err));
	})
}

const findAll = (db, selectionCriteria, projection = {}, order=null) => {
	let params = {};
	if(projection.offset) params.offset = projection.offset;
	if(projection.limit) params.limit = projection.limit;
	if(projection.selectionAttribute) params.attributes = projection.selectionAttribute;
	if(order) params.sort = order;
	return new Promise((resolve, reject) => {
		db.findAll({
				where: selectionCriteria,
				...params,
			}).then(res => {
				const results  = res.map((result) => result.dataValues);
                resolve(results);
            }).catch(err => {
                reject(err);
            });
	});
}

const create = (db, data, transaction = null) => {
	return new Promise((resolve,reject) => {
		db.create(data, { transaction }).then(res => {
			resolve(res?.dataValues);
		}).catch(err => {
			reject(err);
		});
	});
}

const updateRecords = (db, dataToUpdate, selection, transaction = null)=> {
	return new Promise((resolve, reject) => {
		db.update(dataToUpdate, { where: selection, transaction, returning: true, raw: true}).then(([count, updatedRecords]) => {
			const recordsUpdated = count > 0;        
			resolve({ recordsUpdated, updatedRecords });
		}).catch(err => {
			reject(err);
		});
	});
}

const getById = (db, id, group = null)=> {
	return new Promise((resolve, reject) => {
		db.findByPk(id, group).then(res => {
			resolve((res)?res.dataValues : null);
		}).catch(err => {
			reject(err);
		});
	});
}

const rawQuery = (db, query, transaction = null) => {
    return new Promise((resolve, reject) => {
        db.query(query, {
			transaction,
		}).then(([rows]) => {
            resolve(rows);
        }).catch(err => {
            reject(err);
        });
    });
};

const insertMany = (db, data, options = {}) => {
	return new Promise((resolve,reject) => {
		db.bulkCreate(data, options).then(res => {
			resolve(res);
		}).catch(err => {
			reject(err);
		});
	})
}

const deleteRecord = (db, id) => {
	return new Promise((resolve,reject) => {
		db.removeById(id).then(res => {
			resolve(res);
		}).catch(err => {
			reject(err);
		});
	})
}

const deleteManyRecord = (db, selectionCriteria, transaction = null) => {
	return new Promise((resolve, reject) => {
		db.destroy({
			where: selectionCriteria,
			transaction
		  })
		  .then((res) => resolve(res))
		  .catch((err) => reject(err));
	});
  };

const bulkInsertData = (db, data, transaction = null) =>
	new Promise((resolve, reject) => {
		db.bulkCreate(data, { transaction })
			.then((result) => resolve(result))
			.catch((error) => reject(error));
	});

const findAndCountAll = (collection, selectionCriteria, order, selectionAttribute, limit, page, offset) =>
	new Promise((resolve, reject) => {
		const finalLimit = limit || 999999999;
		collection
			.findAndCountAll({
				where: selectionCriteria,
				order,
				attributes: selectionAttribute,
				limit: finalLimit,
				offset: offset,
				raw: true,
			})
			.then(async res => {
				const response = await getPagingData(res, page, limit);
				resolve(response);
			})
			.catch(err => reject(err));
	});

	
const findbyQueryWithPagination = (sequelize, query, page, limit, count) =>
	new Promise((resolve, reject) => {
		sequelize
			.query(query, { type: Sequelize.QueryTypes.SELECT })
			.then(async res => {
				const response = { rows: res, count: count };
				const result = await getPagingData(response, page, limit);
				resolve({
					...result,
					type: 200
				});
			})
			.catch(error => {
				reject(error);
			});
	});

const getPagingData = (data, page, limit) => {
	const { count, rows } = data;
	const currentPage = page ? Number(page) : 0;
	const totalPages = Math.ceil(count / limit);
	return { rows, count, totalPages, currentPage };
};

const findbyQuery = (query, sequelize) =>
new Promise((resolve, reject) => {
  sequelize
      .query(query, {type: Sequelize.QueryTypes.SELECT})
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
});

const findAndInsertMany = (db, data, getSelectionCriteria, transaction = null) =>
	new Promise((resolve, reject) => {
		for (const row of data) {
			db.findOrCreate({
				where: getSelectionCriteria(row),
				defaults: row,
				transaction,
			})
				.then((result) => resolve(result))
				.catch((error) => reject(error));
		}
	});


module.exports = Object.assign({},{
    findOne,
    findAll,
	create,
	rawQuery,
	getById,
	insertMany,
	deleteRecord,
	bulkInsertData,
	updateRecords,
	findAndCountAll,
	findbyQueryWithPagination,
	findbyQuery,
	deleteManyRecord,
	findAndInsertMany,
})