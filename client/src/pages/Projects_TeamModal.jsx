{/* Team View Modal */ }
{
    isTeamModalOpen && (
        <div className="fixed inset-0 bg-black-50 flex items-center justify-center z-1000">
            <div className="bg-surface p-6 rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col animate-fade-in shadow-xl">
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-text-main">Team: {teamProject?.name}</h2>
                        <p className="text-text-muted text-sm">Assigned personnel and their fit scores</p>
                    </div>
                    <button onClick={() => setIsTeamModalOpen(false)} className="btn-icon hover:bg-white/5 rounded-full transition-colors">
                        <X size={20} strokeWidth={1.5} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {teamMembers.length === 0 ? (
                        <div className="text-center text-text-muted py-20 border-2 border-dashed border-border rounded-xl">
                            No team members assigned yet. Use "Find Match" to discover candidates.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {teamMembers.map(member => (
                                <div key={member.id} className="card border border-border p-5 flex justify-between items-start hover:border-primary/30 transition-all">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="font-bold text-lg text-text-main">{member.name}</h3>
                                            <span className="badge badge-gray text-xs">{member.role}</span>
                                            <span className={`badge text-xs font-bold ${member.fitScore >= 80 ? 'badge-green' : 'badge-yellow'}`}>
                                                {member.fitScore}% Match
                                            </span>
                                        </div>

                                        <div className="mb-2">
                                            <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">Skills:</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {member.skills && member.skills.length > 0 ? (
                                                    member.skills.map((skill, i) => (
                                                        <span key={i} className="badge badge-blue text-xs">
                                                            {skill}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-text-muted italic">No skills listed</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleUnassign(member.id)}
                                        className="btn btn-secondary text-xs rounded-full px-4 ml-4 hover:bg-red-500/10 hover:text-red-400 hover:border-red-400/30 transition-all"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
