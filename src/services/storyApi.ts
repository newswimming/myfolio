export async function analyzeStory({file,text}:{file?:File,text?:string}){

  const form=new FormData()
  if(file) form.append('file',file)
  if(text) form.append('text',text)

  const res=await fetch('http://127.0.0.1:8000/analyze-all',{
    method:'POST',
    body:form
  })

  return res.json()
}
