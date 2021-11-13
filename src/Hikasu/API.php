<?php namespace Hikasu;

use Joomla\CMS\Factory;
use Joomla\CMS\Http\Transport\CurlTransport;
use Joomla\CMS\Uri\Uri;
use Joomla\Registry\Registry;

class API
{


	/**
	 * @var string
	 * @since version
	 */
	private static $scheme = 'https';

	/**
	 * @var string
	 * @since version
	 */
	private static $host = 'radicalmart.ru';


	/**
	 * @var string[]
	 * @since version
	 */
	private static $data_request = [
		'option' => 'com_ajax',
		'plugin' => 'swprojectsapi',
		'group' => 'system',
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
		$data_request['key'] = $key;
	}


	public static function categories()
	{
		$result = self::execute('categories');
		if(isset($result->body))
		{
			return $result->body;
		}

		return [];
	}


	public static function projects($category_id, $page = 1, $limit = 12)
	{
		$result = self::execute('projects', [
			'category_id' => $category_id,
			'page' => $page,
			'limit' => $limit
		]);

		return $result->body ?? [];
	}


	public static function projectList($ids)
	{
		$result = self::execute('projectList', ['projects_ids' => $ids]);
		if(isset($result->body))
		{
			return $result->body;
		}

		return [];
	}


	public static function projectsMain()
	{
		$result = self::execute('projectsMain');
		if(isset($result->body))
		{
			return $result->body;
		}

		return [];
	}


	public static function project($id)
	{
		$result = self::execute('project', ['project_id' => $id]);
		if(isset($result->body))
		{
			return $result->body;
		}

		return [];
	}


	public static function projectListCheckVersion($ids)
	{
		$result = self::execute('projectListCheckVersion', ['projects_ids' => json_encode($ids)]);
		if(isset($result->body))
		{
			return $result->body;
		}

		return [];
	}


	public static function getForInstallDepends($id)
	{
		$result = self::execute('getForInstallDepends', ['project_id' => json_encode($id)]);
		if(isset($result->body))
		{
			return $result->body;
		}

		return [];
	}


	public static function projectFile($id)
	{
		$result = self::execute('projectFile', ['project_id' => $id]);
	}


	public static function checkKey($key)
	{
		$result = self::execute('checkKey', ['key' => $key]);
		if(isset($result->body))
		{
			return $result->body;
		}

		return false;
	}


	/**
	 * @param $method
	 * @param array $data
	 *
	 * @return \Joomla\CMS\Http\Response
	 *
	 * @since version
	 */
	private static function execute($method, $data = [])
	{

		$lang = Factory::getLanguage();

		$data_build = http_build_query(
			array_merge(['method' => $method], self::$data_request, $data, ['lang' => $lang->getTag()])
		);

		$curlTransport = new CurlTransport(new Registry());
		$uri = (new Uri());
		$uri->setScheme(self::$scheme);
		$uri->setHost(self::$host);
		$request = $curlTransport->request('GET', $uri, $data_build);
		return $request;
	}


}