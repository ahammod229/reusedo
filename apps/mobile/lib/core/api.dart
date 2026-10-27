import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'config.dart';

/// An API failure with the server's error code ("post_not_found", "ai_limit"…) or "network".
class ApiError implements Exception {
  ApiError(this.code);
  final String code;
  @override
  String toString() => code;
}

/// Thin wrapper over the REST API. Responses are `{ success, data }`; this returns `data`.
class Api {
  Api() : _dio = Dio(BaseOptions(baseUrl: apiUrl, connectTimeout: const Duration(seconds: 15))) {
    _dio.interceptors.add(InterceptorsWrapper(onRequest: (options, handler) async {
      final token = await FirebaseAuth.instance.currentUser?.getIdToken();
      if (token != null) options.headers['Authorization'] = 'Bearer $token';
      handler.next(options);
    }));
  }

  final Dio _dio;

  Future<T> _call<T>(Future<Response<dynamic>> Function() send) async {
    try {
      final res = await send();
      return (res.data as Map<String, dynamic>)['data'] as T;
    } on DioException catch (e) {
      final data = e.response?.data;
      if (e.response == null) throw ApiError('network');
      if (data is Map && data['code'] is String) throw ApiError(data['code'] as String);
      throw ApiError('http_${e.response!.statusCode}');
    }
  }

  Future<T> get<T>(String path, [Map<String, dynamic>? query]) =>
      _call(() => _dio.get(path, queryParameters: _clean(query)));

  Future<T> post<T>(String path, [Object? body]) => _call(() => _dio.post(path, data: body));

  Future<T> patch<T>(String path, [Object? body]) => _call(() => _dio.patch(path, data: body));

  /// Multipart upload (post photos, AI draft). Slow connections get a longer timeout.
  Future<T> upload<T>(String path, FormData form) => _call(() => _dio.post(path,
      data: form, options: Options(sendTimeout: const Duration(seconds: 60), receiveTimeout: const Duration(seconds: 60))));

  static Map<String, dynamic>? _clean(Map<String, dynamic>? q) =>
      q == null ? null : (Map.of(q)..removeWhere((_, v) => v == null || v == false || v == ''));
}

final apiProvider = Provider((_) => Api());
