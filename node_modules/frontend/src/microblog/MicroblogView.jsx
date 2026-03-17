import { Fragment, useCallback, useEffect, useState } from "react"
import { TiDelete } from "react-icons/ti";
import { fetchAPI } from "../api.mjs"
import { useAuthenticate } from "../authentication/useAuthenticate"
import { useNavigate } from "react-router"
import validator from "validator"

function MicroblogView() {
    const navigate = useNavigate()
    const { user } = useAuthenticate()

    const [posts, setPosts] = useState([])
    const [error, setError] = useState(null)

    const getPosts = useCallback(() => {
        setPosts([])
        setError(null)

        fetchAPI("GET", "/posts")
            .then(response => {
                if (response.status == 200) {
                    if (response.body.length > 0) {
                        setPosts(response.body)
                        setError(null)
                    } else {
                        setPosts([])
                        setError("No results found")
                    }
                } else {
                    setError(response.body.message)
                }
            })
            .catch(error => {
                setError(error)
            })
    }, [setPosts, setError])

    useEffect(() => {
        getPosts()
    }, [getPosts])

    const [subject, setSubject] = useState("")
    const [content, setContent] = useState("")

    const [validationErrors, setValidationErrors] = useState({})
    const [loading, setLoading] = useState(false)

    const submitPost = useCallback(() => {
        setLoading(true)

        const escapedSubject = validator.escape(subject)
        const escapedContent = validator.escape(content)

        const validationErrors = {}
        if (!subject) {
            validationErrors["subject"] = "Please enter valid subject."
        }
        if (!content) {
            validationErrors["content"] = "Please enter valid content."
        }
        setValidationErrors(validationErrors)

        if (Object.keys(validationErrors).length > 0) {
            setLoading(false)
            return
        }

        fetchAPI("PUT", "/posts", {
            subject: escapedSubject,
            content: escapedContent,
            writerId: user.id
        }, user.authenticationKey)
            .then(response => {
                if (response.status == 200) {
                    getPosts()
                    setSubject("")
                    setContent("")
                    setLoading(false)
                } else {
                    setError("Failed to create post - " + response.body.message)
                    setLoading(false)
                }
            })
            .catch(error => {
                setError("Failed to create post - " + error)
                setLoading(false)
            })
    }, [subject, content, user, setLoading, setError, setValidationErrors, getPosts])

    const deletePost = useCallback((postId, writerId) => {
        if (!user) return

        setLoading(true)
        fetchAPI("DELETE", "/posts", { postId: postId, writerId: writerId }, user.authenticationKey)
            .then(response => {
                if (response.status == 200) {
                    getPosts()
                    setLoading(false)
                } else {
                    setError("Failed to delete post - " + response.body.message)
                    setLoading(false)
                }
            })
            .catch(error => {
                setError("Failed to delete post - " + error)
                setLoading(false)
            })
    }, [user, getPosts])

    return <section className="flex flex-col gap-4 p-4 items-center">
        {loading && <span className="loading loading-spinner loading-md"></span>}
        <h1 className="text-3xl font-bold mt-2">Microblog</h1>
        {user &&
            <Fragment>
                <input 
                    type="text" 
                    placeholder="Subject" 
                    className="input input-bordered w-full" 
                    value={subject} 
                    onChange={e => setSubject(e.target.value)} />
                {validationErrors.subject && <p className="text-error">{validationErrors.subject}</p>}
                <textarea 
                    placeholder="Content" 
                    className="textarea textarea-bordered h-24 w-full"
                    value={content} 
                    onChange={e => setContent(e.target.value)}></textarea>
                {validationErrors.content && <p className="text-error">{validationErrors.content}</p>}
                <button 
                    className="btn btn-success w-full"
                    onClick={() => submitPost()}>Post</button>
            </Fragment>
        }
        {error && <span className="text-center text-sm min-h-100">{error}</span>}
        {!error && (posts.length == 0
            ? <span className="loading loading-spinner loading-xl"></span>
            : <ul className={user ? "flex flex-col gap-4 w-full overflow-y-auto max-h-70" : "flex flex-col gap-4 w-full overflow-y-auto max-h-70 min-h-110"}>
            {posts.map(post => 
                <li key={post.post.id} className="card card-compact bg-base-100 shadow w-full">
                    <div className="card-body">
                        <div className="flex justify-between items-start w-full">
                            <h2 className="card-title">{post.post.subject}</h2>
                            {user && (post.post.writerId === user.id || user.role === "admin") && (
                                <button
                                    className="btn btn-error btn-sm"
                                    onClick={() => deletePost(post.post.id, post.post.writerId)}>
                                    <TiDelete className="text-2xl" />
                                </button>
                            )}
                        </div>
                        <p className="text-sm text-gray-500">{post.user.firstName} {post.user.lastName}</p>
                        <p className="mt-2">{post.post.content}</p>                        
                    </div>
                </li>
            )}
        </ul>)}
        {!user
            && <div className="flex gap-4 w-full">
                    <button onClick={() => navigate("/register")} className="btn flex-1">
                        Sign Up
                    </button>
                    <button onClick={() => navigate("/login")} className="btn btn-primary flex-1">
                        Login
                    </button>
                </div>
        }
        
    </section>
}

export default MicroblogView