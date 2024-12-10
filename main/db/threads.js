module.exports = function ({ models, api }) {
	const Threads = models.use('Threads');

	async function getInfo(threadID) {
		try {
			const result = await api.getThreadInfo(threadID);
			return result;
		} catch (error) { 
			console.log(error);
			throw new Error("Lỗi khi lấy thông tin luồng.");
		}
	}

	async function getAll(...data) {
		let where, attributes;
		for (const i of data) {
			if (typeof i != 'object') throw new Error("Dữ liệu cần là đối tượng hoặc mảng.");
			if (Array.isArray(i)) attributes = i;
			else where = i;
		}
		try { 
			return (await Threads.findAll({ where, attributes })).map(e => e.get({ plain: true })); 
		} catch (error) {
			console.error(error);
			throw new Error("Lỗi khi lấy tất cả dữ liệu luồng.");
		}
	}

	async function getData(threadID) {
		try {
			const data = await Threads.findOne({ where: { threadID } });
			if (data) return data.get({ plain: true });
			else return false;
		} catch (error) { 
			console.error(error);
			throw new Error("Lỗi khi lấy dữ liệu luồng.");
		}
	}

	async function setData(threadID, options = {}) {
		if (typeof options != 'object' && !Array.isArray(options)) throw new Error("Dữ liệu cần là đối tượng hoặc mảng.");
		try {
			const thread = await Threads.findOne({ where: { threadID } });
			if (thread) {
				await thread.update(options);
			} else {
				await createData(threadID, options);
			}
			return true;
		} catch (error) {
			console.error(error);
			throw new Error("Lỗi khi cập nhật dữ liệu luồng.");
		}
	}

	async function delData(threadID) {
		try {
			const thread = await Threads.findOne({ where: { threadID } });
			if (thread) {
				await thread.destroy();
			}
			return true;
		} catch (error) {
			console.error(error);
			throw new Error("Lỗi khi xóa dữ liệu luồng.");
		}
	}

	async function createData(threadID, defaults = {}) {
		if (typeof defaults != 'object' && !Array.isArray(defaults)) throw new Error("Dữ liệu cần là đối tượng hoặc mảng.");
		try {
			await Threads.findOrCreate({ where: { threadID }, defaults });
			return true;
		} catch (error) {
			console.error(error);
			throw new Error("Lỗi khi tạo dữ liệu luồng.");
		}
	}

	return {
		getInfo,
		getAll,
		getData,
		setData,
		delData,
		createData
	};
};