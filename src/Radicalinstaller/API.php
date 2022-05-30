<?php namespace Radicalinstaller;

defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Http\Transport\CurlTransport;
use Joomla\CMS\Uri\Uri;
use Joomla\CMS\Version;
use Joomla\Registry\Registry;

class API
{


	/**
	 * @var string[]
	 * @since version
	 */
	private static $data_request = [
		'option' => 'com_ajax',
		'plugin' => 'swprojectsapi',
		'group'  => 'system',
		'format' => 'json',
	];


	/**
	 * @param $key
	 *
	 *
	 * @since version
	 */
	public static function setKey($key)
	{
		self::$data_request['key'] = $key;
	}


	public static function categories()
	{
		return self::execute('categories');
	}


	public static function projects($category_id, $page = 1, $limit = 12)
	{
		return self::execute('projects', [
			'category_id' => $category_id,
			'page'        => $page,
			'limit'       => $limit
		]);
	}


	public static function groupsStartPage($key = '')
	{
		return self::execute('groupStartPage', ['key' => $key]);
	}


	public static function projectList($ids)
	{
		return self::execute('projectList', ['projects_ids' => $ids]);
	}


	public static function projectsMain()
	{
		return self::execute('projectsMain');
	}


	public static function project($id)
	{
		return self::execute('project', ['project_id' => $id]);
	}


	public static function projectsMy($key = '')
	{
		return self::execute('projectsMy', ['key' => $key]);
	}


	public static function projectsKey($key = '')
	{
		return self::execute('projectsKey', ['key' => $key]);
	}


	public static function projectsFree()
	{
		return self::execute('projectsFree');
	}


	public static function projectListCheckVersion($ids)
	{
		return self::execute('projectListCheckVersion', ['projects_ids' => json_encode($ids)]);
	}


	public static function getForInstallDepends($id)
	{
		return self::execute('getForInstallDepends', ['project_id' => json_encode($id)]);
	}


	public static function projectFile($id)
	{
		return self::execute('projectFile', ['project_id' => $id]);
	}


	public static function checkKey($key)
	{
		return self::execute(
			'checkKey', ['key' => $key]
		);
	}


	public static function syncExtensions($list = '')
	{
		return self::execute(
			'syncExtensions',
			['extensions' => $list],
			'POST'
		);
	}


	/**
	 * @param          $method
	 * @param   array  $data
	 *
	 * @return string|bool
	 *
	 * @since version
	 */
	private static function execute($method, $data = [], $type = "GET")
	{

		$lang = Factory::getLanguage();

		$data_build = http_build_query(
			array_merge(['method' => $method], self::$data_request, $data, ['lang' => $lang->getTag()])
		);

		$curlTransport = new CurlTransport(new Registry());
		$uri           = (new Uri());
		$uri->setScheme(Config::$scheme);
		$uri->setHost(Config::$host);
		$response = $curlTransport->request($type, $uri, $data_build);

		if (((new Version())->isCompatible('4.0')))
		{
			$body = $response->body;

			return (!empty($body)) ? $response->body : false;
		}

		return (!empty($response->body)) ? $response->body : false;
	}


}