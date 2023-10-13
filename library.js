'use strict';

const nconf = require.main.require('nconf');
const winston = require.main.require('winston');

const meta = require.main.require('./src/meta');

const controllers = require('./lib/controllers');

const routeHelpers = require.main.require('./src/routes/helpers');

const plugin = {};

plugin.createGroupMemberships = async ({uids}) => {
	const User = require.main.require('./src/user');
	const Groups = require.main.require('./src/groups');
	
	console.log(`group-membership-for-user-csv-importing: Membership creation started.`);
	console.log(`group-membership-for-user-csv-importing: Memberships will be created for the following uids: ${uids}.`);
	
	const createdUsers = await User.getUsersWithFields(uids,['uid', 'groups_to_import',],0);
	
	await Promise.all(createdUsers.map(async (user) => {
		try {
			const groupsToJoin = user.groups_to_import.split(",");
			await Groups.join(groupsToJoin, user.uid);
			console.log(`group-membership-for-user-csv-importing: User ${user.uid} is now a member of group ${groupsToJoin}.`);	
		} catch (error) {
			console.error(`group-membership-for-user-csv-importing: An error occoured when creating group memberships!`);
			console.error(error);
		}
	}))
	
	console.log("group-membership-for-user-csv-importing: Membership creation finished.");
}

plugin.init = async (params) => {
	const { router } = params;

	routeHelpers.setupPageRoute(router, '/nodebb-plugin-group-membership-for-user-csv-importing', [(req, res, next) => {
		setImmediate(next);
	}], (req, res) => {
		winston.info(`[plugins/nodebb-plugin-group-membership-for-user-csv-importing] Navigated to ${nconf.get('relative_path')}/nodebb-plugin-group-membership-for-user-csv-importing`);
		res.render('quickstart', { uid: req.uid });
	});

	routeHelpers.setupAdminPageRoute(router, '/admin/plugins/nodebb-plugin-group-membership-for-user-csv-importing', controllers.renderAdminPage);
};

plugin.addAdminNavigation = (header) => {
	header.plugins.push({
		route: '/plugins/nodebb-plugin-group-membership-for-user-csv-importing',
		icon: 'fa-tint',
		name: 'Import Users via CSV - Extension',
	});

	return header;
};

module.exports = plugin;