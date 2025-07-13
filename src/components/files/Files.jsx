import { useState, useEffect } from "react";
import { 
  DocumentIcon, 
  CloudArrowUpIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { supabase } from "../../services/supabaseClient";

const Files = () => {
  const [appName, setAppName] = useState("");
  const [version, setVersion] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [appFiles, setAppFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Test files state
  const [selectedTestFile, setSelectedTestFile] = useState(null);
  const [testFiles, setTestFiles] = useState([]);
  const [uploadingTest, setUploadingTest] = useState(false);
  const [selectedTestFiles, setSelectedTestFiles] = useState([]);
  const [selectAllTest, setSelectAllTest] = useState(false);

  // Fetch existing app files from Supabase
  useEffect(() => {
    fetchAppFiles();
    fetchTestFiles();
  }, []);

  const fetchAppFiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('app_files')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_date', { ascending: false });
      
      if (error) throw error;
      console.log('Fetched app files:', data);
      setAppFiles(data || []);
    } catch (error) {
      console.error('Error fetching app files:', error);
    }
  };

  const fetchTestFiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('test_files')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_date', { ascending: false });
      
      if (error) throw error;
      console.log('Fetched test files:', data);
      setTestFiles(data || []);
    } catch (error) {
      console.error('Error fetching test files:', error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const getOS = (filename) => {
    const name = filename.toLowerCase();
    if (name.includes('android') || name.includes('.apk')) return 'Android';
    if (name.includes('ios') || name.includes('.ipa')) return 'iOS';
    if (name.includes('windows') || name.includes('.exe')) return 'Windows';
    if (name.includes('mac') || name.includes('.dmg')) return 'macOS';
    return 'Unknown';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!selectedFile || !appName.trim() || !version.trim()) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const filePath = `${user.id}/app-files/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Save file metadata to database
      const { error: insertError } = await supabase
        .from('app_files')
        .insert({
          user_id: user.id,
          app_name: appName.trim(),
          version: version.trim(),
          filename: selectedFile.name,
          file_path: filePath,
          size: selectedFile.size,
          os: getOS(selectedFile.name),
          uploaded_date: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // Reset form and refresh list
      setAppName("");
      setVersion("");
      setSelectedFile(null);
      document.getElementById('file-input').value = '';
      await fetchAppFiles();
      
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, filePath) => {
    try {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete record from database
      const { error: deleteError } = await supabase
        .from('app_files')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchAppFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error deleting file: ' + error.message);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedFiles.length === 0) return;
    
    try {
      const filesToDelete = appFiles.filter(file => selectedFiles.includes(file.id));
      const filePaths = filesToDelete.map(file => file.file_path || file.path);
      
      // Delete files from storage
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove(filePaths);

      if (storageError) throw storageError;

      // Delete records from database
      const { error: deleteError } = await supabase
        .from('app_files')
        .delete()
        .in('id', selectedFiles);

      if (deleteError) throw deleteError;

      setSelectedFiles([]);
      setSelectAll(false);
      await fetchAppFiles();
    } catch (error) {
      console.error('Error deleting files:', error);
      alert('Error deleting files: ' + error.message);
    }
  };

  const handleSelectFile = (fileId) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(appFiles.map(file => file.id));
    }
    setSelectAll(!selectAll);
  };

  const handleTestFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedTestFile(file);
  };

  const getFileType = (filename) => {
    const ext = filename.toLowerCase().split('.').pop();
    const typeMap = {
      'pdf': 'PDF',
      'doc': 'Word',
      'docx': 'Word',
      'xls': 'Excel',
      'xlsx': 'Excel',
      'ppt': 'PowerPoint',
      'pptx': 'PowerPoint',
      'txt': 'Text',
      'csv': 'CSV',
      'json': 'JSON',
      'xml': 'XML',
      'zip': 'Archive',
      'rar': 'Archive',
      'jpg': 'Image',
      'jpeg': 'Image',
      'png': 'Image',
      'gif': 'Image',
      'mp4': 'Video',
      'avi': 'Video',
      'mov': 'Video'
    };
    return typeMap[ext] || 'Unknown';
  };

  const handleTestUpload = async () => {
    if (!selectedTestFile) return;

    setUploadingTest(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload file to Supabase Storage
      const fileExt = selectedTestFile.name.split('.').pop();
      const fileName = `${Date.now()}_${selectedTestFile.name}`;
      const filePath = `${user.id}/test-files/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, selectedTestFile);

      if (uploadError) throw uploadError;

      // Save file metadata to database using raw SQL to bypass schema cache
      try {
        const { data: insertData, error: rpcError } = await supabase
          .rpc('insert_test_file', {
            user_id: user.id,
            name: selectedTestFile.name,
            file_path: filePath,
            size: selectedTestFile.size,
            type: getFileType(selectedTestFile.name),
            uploaded_date: new Date().toISOString()
          });

        if (rpcError) {
          console.log('RPC failed, trying direct insert:', rpcError.message);
          throw rpcError;
        }
      } catch (rpcError) {
        console.log('Using direct SQL insert as fallback');
        
        // Fallback: Use direct SQL query
        const { data, error: sqlError } = await supabase
          .from('test_files')
          .insert([{
            user_id: user.id,
            name: selectedTestFile.name,
            file_path: filePath,
            size: selectedTestFile.size,
            type: getFileType(selectedTestFile.name),
            uploaded_date: new Date().toISOString()
          }])
          .select();

        if (sqlError) {
          console.error('Direct SQL insert also failed:', sqlError);
          throw sqlError;
        }
        
        console.log('Direct insert successful:', data);
      }

      // Reset form and refresh list
      setSelectedTestFile(null);
      document.getElementById('test-file-input').value = '';
      await fetchTestFiles();
      
    } catch (error) {
      console.error('Error uploading test file:', error);
      alert('Error uploading test file: ' + error.message);
    } finally {
      setUploadingTest(false);
    }
  };

  const handleDeleteSelectedTest = async () => {
    if (selectedTestFiles.length === 0) return;
    
    try {
      const filesToDelete = testFiles.filter(file => selectedTestFiles.includes(file.id));
      const filePaths = filesToDelete.map(file => file.file_path || file.path);
      
      // Delete files from storage
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove(filePaths);

      if (storageError) throw storageError;

      // Delete records from database
      const { error: deleteError } = await supabase
        .from('test_files')
        .delete()
        .in('id', selectedTestFiles);

      if (deleteError) throw deleteError;

      setSelectedTestFiles([]);
      setSelectAllTest(false);
      await fetchTestFiles();
    } catch (error) {
      console.error('Error deleting test files:', error);
      alert('Error deleting test files: ' + error.message);
    }
  };

  const handleSelectTestFile = (fileId) => {
    setSelectedTestFiles(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  };

  const handleSelectAllTest = () => {
    if (selectAllTest) {
      setSelectedTestFiles([]);
    } else {
      setSelectedTestFiles(testFiles.map(file => file.id));
    }
    setSelectAllTest(!selectAllTest);
  };

  const handlePreviewFile = async (file, isTestFile = false) => {
    try {
      // Handle both possible field names for file path
      const filePath = file.file_path || file.path;
      
      console.log('Attempting to open file:', {
        fileName: file.filename || file.name,
        filePath: filePath,
        isTestFile: isTestFile,
        fileObject: file
      });

      if (!filePath) {
        throw new Error('File path not found in database record');
      }
      
      const { data, error } = await supabase.storage
        .from('files')
        .createSignedUrl(filePath, 3600); // 1 hour expiry
      
      if (error) {
        console.error('Supabase storage error:', error);
        throw error;
      }
      
      console.log('Successfully got signed URL:', data.signedUrl);
      
      // Open in new tab
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error opening file:', error);
      alert('Error opening file: ' + error.message);
    }
  };

  const canUpload = appName.trim() && version.trim();

  return (
    <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <style jsx>{`
        .tab:checked {
          background-color: #42A5F5 !important;
          color: #1e40af !important;
          border-color: #3b82f6 !important;
        }
        .tab:not(:checked) {
          background-color: #f8fafc;
          color: #64748b;
        }
        .tab:not(:checked):hover {
          background-color: #e2e8f0;
          color: #334155;
        }
      `}</style>
      <div className="tabs tabs-lifted w-full">
        {/* App Files Tab - 50% width */}
        <input 
          type="radio" 
          name="file_tabs" 
          className="tab w-1/2 font-semibold" 
          aria-label="App Files" 
          defaultChecked 
        />
        <div className="tab-content bg-base-100 border-base-300 p-6 h-full">
          {/* App Files Section */}
          <div className="h-full flex flex-col">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">App Files</h2>
            
            {/* Controls in one line: File Input, App Name, Version, Upload, Delete */}
            <div className="flex items-end space-x-4 mb-6 flex-shrink-0">
              {/* File Selection */}
              <div className="flex-shrink-0">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File
                </label>
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".apk,.ipa,.exe,.dmg,.zip,.rar"
                />
                <label
                  htmlFor="file-input"
                  className="btn btn-outline btn-sm cursor-pointer"
                >
                  <DocumentIcon className="w-4 h-4 mr-2" />
                  {selectedFile ? selectedFile.name : 'Choose File'}
                </label>
              </div>
              
              {/* App Name Input */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  App Name
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Enter app name"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                />
              </div>
              
              {/* Version Input */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Version
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Enter version"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                />
              </div>
              
              {/* Upload Button */}
              <div className="flex-shrink-0">
                <button
                  onClick={handleUpload}
                  disabled={!canUpload || !selectedFile || uploading}
                  className="btn btn-primary btn-sm"
                >
                  <CloudArrowUpIcon className="w-4 h-4 mr-1" />
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
              
              {/* Delete Selected Button */}
              <div className="flex-shrink-0">
                <button
                  onClick={handleDeleteSelected}
                  disabled={selectedFiles.length === 0}
                  className="btn btn-error btn-sm"
                >
                  <TrashIcon className="w-4 h-4 mr-1" />
                  Delete ({selectedFiles.length})
                </button>
              </div>
            </div>

            {/* App Files Table - Scrollable */}
            <div className="flex-1 overflow-y-auto overflow-x-auto max-h-[calc(100vh-400px)]">
              {appFiles.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <DocumentIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No app files uploaded</p>
                  <p className="text-sm">Upload your first app file to get started</p>
                </div>
              ) : (
                <table className="table table-zebra w-full">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      <th className="text-left font-semibold">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={selectAll}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th className="text-left font-semibold">App Name</th>
                      <th className="text-left font-semibold">Version</th>
                      <th className="text-left font-semibold">OS</th>
                      <th className="text-left font-semibold">Filename</th>
                      <th className="text-left font-semibold">Size</th>
                      <th className="text-left font-semibold">Uploaded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-gray-50">
                        <td>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={selectedFiles.includes(file.id)}
                            onChange={() => handleSelectFile(file.id)}
                          />
                        </td>
                        <td className="font-medium">{file.app_name}</td>
                        <td>{file.version}</td>
                        <td>
                          <span className="badge badge-outline badge-sm">
                            {file.os}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handlePreviewFile(file)}
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer bg-transparent border-none p-0"
                            title="Click to open file"
                          >
                            {file.filename}
                          </button>
                        </td>
                        <td className="text-sm">{formatFileSize(file.size)}</td>
                        <td className="text-sm text-gray-500">
                          {new Date(file.uploaded_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Test Files Tab - 50% width */}
        <input 
          type="radio" 
          name="file_tabs" 
          className="tab w-1/2 font-semibold" 
          aria-label="Test Files" 
        />
        <div className="tab-content bg-base-100 border-base-300 p-6 h-full">
          {/* Test Files Section */}
          <div className="h-full flex flex-col">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Test Files</h2>
            
            {/* Test Files Controls */}
            <div className="flex items-end space-x-4 mb-6 flex-shrink-0">
              {/* File Selection */}
              <div className="flex-shrink-0">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Test File
                </label>
                <input
                  id="test-file-input"
                  type="file"
                  className="hidden"
                  onChange={handleTestFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.xml,.zip,.rar,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov"
                />
                <label
                  htmlFor="test-file-input"
                  className="btn btn-outline btn-sm cursor-pointer"
                >
                  <DocumentIcon className="w-4 h-4 mr-2" />
                  {selectedTestFile ? selectedTestFile.name : 'Choose Test File'}
                </label>
              </div>
              
              {/* Upload Button */}
              <div className="flex-shrink-0">
                <button
                  onClick={handleTestUpload}
                  disabled={!selectedTestFile || uploadingTest}
                  className="btn btn-primary btn-sm"
                >
                  <CloudArrowUpIcon className="w-4 h-4 mr-1" />
                  {uploadingTest ? 'Uploading...' : 'Upload'}
                </button>
              </div>
              
              {/* Delete Selected Button */}
              <div className="flex-shrink-0">
                <button
                  onClick={handleDeleteSelectedTest}
                  disabled={selectedTestFiles.length === 0}
                  className="btn btn-error btn-sm"
                >
                  <TrashIcon className="w-4 h-4 mr-1" />
                  Delete ({selectedTestFiles.length})
                </button>
              </div>
            </div>

            {/* Test Files Table - Scrollable */}
            <div className="flex-1 overflow-y-auto overflow-x-auto max-h-[calc(100vh-400px)]">
              {testFiles.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <DocumentIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No test files uploaded</p>
                  <p className="text-sm">Upload your first test file to get started</p>
                </div>
              ) : (
                <table className="table table-zebra w-full">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      <th className="text-left font-semibold">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={selectAllTest}
                          onChange={handleSelectAllTest}
                        />
                      </th>
                      <th className="text-left font-semibold">Type</th>
                      <th className="text-left font-semibold">Name</th>
                      <th className="text-left font-semibold">Size</th>
                      <th className="text-left font-semibold">Uploaded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-gray-50">
                        <td>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={selectedTestFiles.includes(file.id)}
                            onChange={() => handleSelectTestFile(file.id)}
                          />
                        </td>
                        <td>
                          <span className="badge badge-outline badge-sm">
                            {file.type}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handlePreviewFile(file, true)}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer bg-transparent border-none p-0"
                            title="Click to open file"
                          >
                            {file.name}
                          </button>
                        </td>
                        <td className="text-sm">{formatFileSize(file.size)}</td>
                        <td className="text-sm text-gray-500">
                          {new Date(file.uploaded_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Files;
