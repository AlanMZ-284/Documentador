/**
 * shared/services/storage.service.js — Servicio de almacenamiento S3/MinIO
 *
 * Abstrae todas las operaciones sobre S3 compatible (AWS S3 o MinIO local).
 * Uso: import { storageService } from './storage.service.js'
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { logger } from '../utils/logger.js'

const s3 = new S3Client({
  endpoint:        process.env.S3_ENDPOINT,
  region:          process.env.S3_REGION   || 'us-east-1',
  credentials: {
    accessKeyId:     process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: true,   // Necesario para MinIO
})

const BUCKET = process.env.S3_BUCKET || 'documentador-docs'

export const storageService = {
  /**
   * Subir un archivo a S3.
   * @param {Object} opts
   * @param {string} opts.key — Ruta dentro del bucket (ej: 'documents/2024/uuid.pdf')
   * @param {Buffer} opts.body — Contenido del archivo
   * @param {string} opts.contentType — MIME type (ej: 'application/pdf')
   * @param {Object} opts.metadata — Metadata adicional opcional
   */
  async upload({ key, body, contentType, metadata = {} }) {
    const command = new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         key,
      Body:        body,
      ContentType: contentType,
      Metadata:    metadata,
    })
    try {
      await s3.send(command)
      logger.debug({ key, size: body.byteLength }, 'Archivo subido a S3')
      return { key, bucket: BUCKET }
    } catch (err) {
      logger.error({ err, key }, 'Error al subir archivo a S3')
      throw err
    }
  },

  /**
   * Generar URL pre-firmada para descarga/preview sin autenticación S3.
   * @param {Object} opts
   * @param {string} opts.key — Clave del archivo en S3
   * @param {number} opts.expiresIn — Segundos hasta expiración (default: 3600)
   */
  async getSignedUrl({ key, expiresIn = 3600 }) {
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
    try {
      return await getSignedUrl(s3, command, { expiresIn })
    } catch (err) {
      logger.error({ err, key }, 'Error generando URL pre-firmada')
      throw err
    }
  },

  /**
   * Eliminar un archivo de S3.
   */
  async delete({ key }) {
    const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
    try {
      await s3.send(command)
      logger.debug({ key }, 'Archivo eliminado de S3')
    } catch (err) {
      logger.error({ err, key }, 'Error al eliminar archivo de S3')
      throw err
    }
  },

  /**
   * Verificar si un archivo existe en S3.
   */
  async exists({ key }) {
    try {
      await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
      return true
    } catch {
      return false
    }
  },

  /**
   * Descargar un objeto de S3 como Buffer.
   */
  async downloadBuffer({ key }) {
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
    try {
      const res = await s3.send(command)
      const chunks = []
      for await (const chunk of res.Body) {
        chunks.push(Buffer.from(chunk))
      }
      return Buffer.concat(chunks)
    } catch (err) {
      logger.error({ err, key }, 'Error descargando buffer de S3')
      throw err
    }
  },

  /**
   * Listar objetos bajo un prefijo (recursive).
   * @param {Object} opts
   * @param {string} opts.prefix
   * @param {number} [opts.maxKeys=1000]
   * @returns {Promise<Array<{Key:string, Size:number, LastModified:Date}>>}
   */
  async listObjects({ prefix, maxKeys = 1000 }) {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      MaxKeys: maxKeys,
    })
    try {
      const res = await s3.send(command)
      return (res.Contents || []).map((o) => ({
        Key: o.Key,
        Size: o.Size,
        LastModified: o.LastModified,
      }))
    } catch (err) {
      logger.error({ err, prefix }, 'Error listando objetos de S3')
      throw err
    }
  },

  /**
   * Subir múltiples archivos (batch) bajo un mismo prefijo.
   * @param {Object} opts
   * @param {string} opts.prefix — Carpeta destino (ej: 'extractions/<uuid>')
   * @param {Array<{name:string, content:Buffer, contentType:string}>} opts.files
   * @returns {Promise<Array<{key:string, name:string, size:number, contentType:string}>>}
   */
  async uploadBatch({ prefix, files }) {
    const results = []
    for (const f of files) {
      const key = `${prefix.replace(/\/+$/, '')}/${f.name}`
      await this.upload({ key, body: f.content, contentType: f.contentType })
      results.push({ key, name: f.name, size: f.content.byteLength, contentType: f.contentType })
    }
    return results
  },
}
