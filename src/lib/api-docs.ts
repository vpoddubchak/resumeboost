/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         user_id:
 *           type: integer
 *           description: The unique identifier for the user
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email address
 *         first_name:
 *           type: string
 *           description: The user's first name
 *         last_name:
 *           type: string
 *           description: The user's last name
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: When the user was created
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: When the user was last updated
 *       required:
 *         - email
 *         - password_hash
 *     
 *     Upload:
 *       type: object
 *       properties:
 *         upload_id:
 *           type: integer
 *           description: The unique identifier for the upload
 *         user_id:
 *           type: integer
 *           description: The user who uploaded the file
 *         file_name:
 *           type: string
 *           description: The name of the uploaded file
 *         file_path:
 *           type: string
 *           description: The path where the file is stored
 *         file_size:
 *           type: integer
 *           description: The size of the file in bytes
 *         mime_type:
 *           type: string
 *           description: The MIME type of the file
 *         upload_status:
 *           type: string
 *           enum: [uploaded, processing, completed, failed]
 *           description: The status of the upload
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: When the file was uploaded
 *       required:
 *         - user_id
 *         - file_name
 *         - file_path
 *         - file_size
 *         - mime_type
 *     
 *     Analysis:
 *       type: object
 *       properties:
 *         analysis_id:
 *           type: integer
 *           description: The unique identifier for the analysis
 *         upload_id:
 *           type: integer
 *           description: The upload being analyzed
 *         user_id:
 *           type: integer
 *           description: The user who requested the analysis
 *         analysis_data:
 *           type: object
 *           description: The analysis results
 *         score:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           description: The analysis score
 *         recommendations:
 *           type: object
 *           description: Recommendations based on the analysis
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: When the analysis was created
 *       required:
 *         - upload_id
 *         - user_id
 *         - analysis_data
 *     
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *         data:
 *           type: object
 *           description: The response data
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *               description: The error code
 *             message:
 *               type: string
 *               description: The error message
 *         meta:
 *           type: object
 *           properties:
 *             timestamp:
 *               type: string
 *               format: date-time
 *               description: The timestamp of the response
 *             count:
 *               type: integer
 *               description: The number of items in the response
 *       required:
 *         - success
   
 *   responses:
 *     Success:
 *       description: Successful response
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ApiResponse'
 *               - type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   data:
 *                     type: object
 *                   meta:
 *                     type: object
 *                     properties:
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *     
 *     Error:
 *       description: Error response
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ApiResponse'
 *               - type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: false
 *                   error:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                         example: VALIDATION_ERROR
 *                       message:
 *                         type: string
 *                         example: Invalid input
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       500:
 *         $ref: '#/components/responses/Error'
 *   
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password_hash:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *             required:
 *               - email
 *               - password_hash
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/Error'
 *       409:
 *         $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/Error'

 * @swagger
 * /api/uploads:
 *   get:
 *     summary: Get all uploads
 *     tags: [Uploads]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       500:
 *         $ref: '#/components/responses/Error'
 *   
 *   post:
 *     summary: Create a new upload
 *     tags: [Uploads]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               file_name:
 *                 type: string
 *               file_path:
 *                 type: string
 *               file_size:
 *                 type: integer
 *               mime_type:
 *                 type: string
 *             required:
 *               - user_id
 *               - file_name
 *               - file_path
 *               - file_size
 *               - mime_type
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/Error'

 * @swagger
 * /api/files/upload-url:
 *   post:
 *     summary: Generate a presigned URL for file upload
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               file_name:
 *                 type: string
 *               file_size:
 *                 type: integer
 *               mime_type:
 *                 type: string
 *             required:
 *               - file_name
 *               - file_size
 *               - mime_type
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
