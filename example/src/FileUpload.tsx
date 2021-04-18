import React, { useRef, useEffect, useCallback } from 'react'
// Based on https://codepen.io/nekobog/pen/JjoZvBm
interface FileUploadProps {
    onFileUploaded: (filename: string, text?: string, buffer?: ArrayBuffer) => void
}
const FileUpload = ({ onFileUploaded }: FileUploadProps) => {
    const domElement = useRef<HTMLDivElement | null>(null);

    const showDropZone = useCallback(() => {
        if (domElement.current) {
            domElement.current.style.display = "block";
        }
    }, [])

    const hideDropZone = useCallback(() => {
        if (domElement.current) {
            domElement.current.style.display = "none";
        }
    }, [])

    const allowDrag = useCallback((e: DragEvent) => {
        if (true) {  // Test that the item being dragged is a valid one
            e.dataTransfer!.dropEffect = 'copy';
            e.preventDefault();
        }
    }, [])

    const handleDrop = useCallback(async (e: DragEvent) => {
        e.preventDefault();
        hideDropZone();
        const files = e.dataTransfer?.files
        if (files && files.length > 0) {
            const filename = files[0].name
            let text, buffer;
            if (filename.endsWith('.bin')) {
                buffer = await files[0].arrayBuffer()
            } else {
                text = await files[0].text()
            }
            onFileUploaded(filename, text, buffer)
        }

    }, [hideDropZone, onFileUploaded])

    useEffect(() => {
        if (domElement.current) {
            window.addEventListener('dragenter', function (e) {
                showDropZone();
            });

            domElement.current.addEventListener('dragenter', allowDrag);
            domElement.current.addEventListener('dragover', allowDrag);

            domElement.current.addEventListener('dragleave', function (e) {
                hideDropZone();
            });

            domElement.current.addEventListener('drop', handleDrop);
        }

    }, [allowDrag, domElement, handleDrop, hideDropZone, showDropZone])

    return (
        <div ref={domElement} className="dropzone" id="dropzone" />
    )
}

export default FileUpload