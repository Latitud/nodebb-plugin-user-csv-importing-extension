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
	const { router /* , middleware , controllers */ } = params;

	// Settings saved in the plugin settings can be retrieved via settings methods
	//const { setting1, setting2 } = await meta.settings.get('quickstart');
	//if (setting1) {
	//		console.log(setting2);
	//}

	/**
	 * We create two routes for every view. One API call, and the actual route itself.
	 * Use the `setupPageRoute` helper and NodeBB will take care of everything for you.
	 *
	 * Other helpers include `setupAdminPageRoute` and `setupAPIRoute`
	 * */
	routeHelpers.setupPageRoute(router, '/nodebb-plugin-group-membership-for-user-csv-importing', [(req, res, next) => {
		winston.info(`[plugins/nodebb-plugin-group-membership-for-user-csv-importing] In middleware. This argument can be either a single middleware or an array of middlewares`);
		setImmediate(next);
	}], (req, res) => {
		winston.info(`[plugins/nodebb-plugin-group-membership-for-user-csv-importing] Navigated to ${nconf.get('relative_path')}/nodebb-plugin-group-membership-for-user-csv-importing`);
		res.render('quickstart', { uid: req.uid });
	});

	routeHelpers.setupAdminPageRoute(router, '/admin/plugins/nodebb-plugin-group-membership-for-user-csv-importing', controllers.renderAdminPage);
};

/**
 * If you wish to add routes to NodeBB's RESTful API, listen to the `static:api.routes` hook.
 * Define your routes similarly to above, and allow core to handle the response via the
 * built-in helpers.formatApiResponse() method.
 *
 * In this example route, the `ensureLoggedIn` middleware is added, which means a valid login
 * session or bearer token (which you can create via ACP > Settings > API Access) needs to be
 * passed in.
 *
 * To call this example route:
 *   curl -X GET \
 * 		http://example.org/api/v3/plugins/quickstart/test \
 * 		-H "Authorization: Bearer some_valid_bearer_token"
 *
 * Will yield the following response JSON:
 * 	{
 *		"status": {
 *			"code": "ok",
 *			"message": "OK"
 *		},
 *		"response": {
 *			"foobar": "test"
 *		}
 *	}
 */
plugin.addRoutes = async ({ router, middleware, helpers }) => {
	const middlewares = [
		middleware.ensureLoggedIn,			// use this if you want only registered users to call this route
		// middleware.admin.checkPrivileges,	// use this to restrict the route to administrators
	];

	routeHelpers.setupApiRoute(router, 'get', '/quickstart/:param1', middlewares, (req, res) => {
		helpers.formatApiResponse(200, res, {
			foobar: req.params.param1,
		});
	});
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